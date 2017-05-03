var simulatorScene = {
    camera: new THREE.Camera(),
    observerScene: new THREE.Scene(),
    displayUpdateScene: new THREE.Scene(),
    lightFieldScene: new THREE.Scene(),
    uniforms: null,

    display1RenderTarget: null,
    display2RenderTarget: null,
    lightFieldRenderTarget: null,

    properties: {
        display1ResX: 48.0,
        display1ResY: 48.0,
        display1Height: 60.0,
        display1Distance: 150.0,

        display2ResX: 48.0,
        display2ResY: 48.0,
        display2Height: 60.0,
        display2Distance: 160.0,

        pupilSamples: 256,
        pupilDiameter: 16.0,
        retinaHeight: 6.0,
        focalLength: 24.0,
        accommodationDistance: 150.0,

        eyePositionX: 0.0,
        eyePositionY: 0.0,
        eyePositionZ: 0.0,

        setupGUI: function (canvas) {
            var f1 = canvas.gui.addFolder('Display 1 Properties');
            f1.add(this, 'display1ResX').listen();
            f1.add(this, 'display1ResY').listen();
            f1.add(this, 'display1Height').listen();
            f1.add(this, 'display1Distance').listen();
            var f2 = canvas.gui.addFolder('Display 2 Properties');
            f2.add(this, 'display2ResX').listen();
            f2.add(this, 'display2ResY').listen();
            f2.add(this, 'display2Height').listen();
            f2.add(this, 'display2Distance').listen();
            var f3 = canvas.gui.addFolder('Intrinsic Eye Properties');
            f3.add(this, 'pupilSamples').listen();
            f3.add(this, 'pupilDiameter').listen();
            f3.add(this, 'retinaHeight').listen();
            f3.add(this, 'focalLength').listen();
            f3.add(this, 'accommodationDistance').listen();
            var f4 = canvas.gui.addFolder('Extrinsic Eye Properties');
            f4.add(this, 'eyePositionX').listen();
            f4.add(this, 'eyePositionY').listen();
            f4.add(this, 'eyePositionZ').listen();
            var f5 = canvas.gui.addFolder('Actions');
            f5.add(canvas, 'saveScreenshot');
        }
    },

    setup: function (canvas) {
        // Setup GUI
        this.properties.setupGUI(canvas);

        // Fetch all the setup resources (shaders...)
        var urls = ['shaders/basic.vert', 'shaders/observer.frag', 'shaders/displayUpdate.frag', 'shaders/lightField.frag'];
        var requests = urls.map(url => fetch(url).then(response => response.text()));
        Promise.all(requests).then(resources => { this.onSetupResourcesReady(resources); }).then(canvas.onSceneSetupDone.bind(canvas));
    },

    onSetupResourcesReady: function (resources) {
        // Resources
        var vertexShader = resources[0];
        var observerFragmentShader = resources[1];
        var displayUpdateFragmentShader = resources[2];
        var lightFieldFragmentShader = resources[3];
        
        // Setup camera (Fixed quad-viewing camera, not our ray-casting camera)
        this.camera.position.z = 1;

        // Setup a render targets
        this.display1RenderTarget = new THREE.WebGLRenderTarget(this.properties.display1ResX, this.properties.display1ResY);
        this.display1RenderTarget.texture.minFilter = THREE.NearestFilter;
        this.display1RenderTarget.texture.magFilter = THREE.NearestFilter;

        this.display2RenderTarget = new THREE.WebGLRenderTarget(this.properties.display2ResX, this.properties.display2ResY);
        this.display2RenderTarget.texture.minFilter = THREE.NearestFilter;
        this.display2RenderTarget.texture.magFilter = THREE.NearestFilter;

        this.lightFieldRenderTarget = new THREE.WebGLRenderTarget(this.properties.display1ResX * this.properties.display2ResX, this.properties.display1ResY * this.properties.display2ResY);
        this.lightFieldRenderTarget.texture.minFilter = THREE.NearestFilter;
        this.lightFieldRenderTarget.texture.magFilter = THREE.NearestFilter;

        // Setup uniforms
        var textureLoader = new THREE.TextureLoader();
        this.uniforms = {
            deltaTime: {type: 'f', value: 0.0},
            resolution: {type: 'v2', value: new THREE.Vector2()},
            currentDisplayUpdate: {type: 'i', value: 1},

            display1Resolution: {type: 'v2', value: new THREE.Vector2()},
            display2Resolution: {type: 'v2', value: new THREE.Vector2()},
            display1Size: {type: 'v3', value: new THREE.Vector3()},
            display2Size: {type: 'v3', value: new THREE.Vector3()},

            pupilSamples: {type: 'i', value: 0},
            pupilDiameter: {type: 'f', value: 0.0},
            retinaHeight: {type: 'f', value: 0.0},
            focalLength: {type: 'f', value: 0.0},
            accommodationDistance: {type: 'f', value: 0.0},

            eyePosition: {type: 'v3', value: new THREE.Vector3()},

            display1: {type: "t", value: this.display1RenderTarget.texture},
            display2: {type: "t", value: this.display2RenderTarget.texture},
            lightField: {type: "t", value: this.lightFieldRenderTarget.texture}
        };

        // Setup materials
        var observerMaterial = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: observerFragmentShader
        } );

        var displayUpdateMaterial = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: displayUpdateFragmentShader
        } );

        var lightFieldMaterial = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: lightFieldFragmentShader
        } );

        // Setup geometry
        var geometry = new THREE.PlaneBufferGeometry(2, 2);

        // Setup meshes
        var observerMesh = new THREE.Mesh(geometry, observerMaterial);
        var displayUpdateMesh = new THREE.Mesh(geometry, displayUpdateMaterial);
        var lightFieldMesh = new THREE.Mesh(geometry, lightFieldMaterial);

        // Setup scenes
        this.observerScene.add(observerMesh);
        this.displayUpdateScene.add(displayUpdateMesh);
        this.lightFieldScene.add(lightFieldMesh);
    },

    render: function (renderer, deltaTime, input) {
        // Process input
        this.processInput(deltaTime, input);

        // Update uniforms
        this.updateUniforms(renderer, deltaTime);

        // Update light field
        renderer.render(this.lightFieldScene, this.camera, this.lightFieldRenderTarget);

        // Update displays
        this.uniforms.currentDisplayUpdate.value = 1;
        renderer.render(this.displayUpdateScene, this.camera, this.display1RenderTarget);
        this.uniforms.currentDisplayUpdate.value = 2;
        renderer.render(this.displayUpdateScene, this.camera, this.display2RenderTarget);

        // Render to screen the observed image
        renderer.render(this.observerScene, this.camera);
    },

    processInput: function (deltaTime, input) {
        this.properties.eyePositionX += input.deltaX;
        this.properties.eyePositionY += input.deltaY;

        this.properties.accommodationDistance += input.deltaWheel;
    },

    updateUniforms: function (renderer, deltaTime) {
        this.uniforms.deltaTime.value = deltaTime;

        this.uniforms.resolution.value.x = renderer.domElement.width;
        this.uniforms.resolution.value.y = renderer.domElement.height;

        this.uniforms.display1Resolution.value.x = this.properties.display1ResX;
        this.uniforms.display1Resolution.value.y = this.properties.display1ResY;
        this.uniforms.display2Resolution.value.x = this.properties.display2ResX;
        this.uniforms.display2Resolution.value.y = this.properties.display2ResY;

        var aspect1 = this.properties.display1ResX / this.properties.display1ResY;
        var aspect2 = this.properties.display2ResX / this.properties.display2ResY;

        this.uniforms.display1Size.value.x = this.properties.display1Height * aspect1;
        this.uniforms.display1Size.value.y = this.properties.display1Height;
        this.uniforms.display1Size.value.z = -this.properties.display1Distance;
        this.uniforms.display2Size.value.x = this.properties.display2Height * aspect2;
        this.uniforms.display2Size.value.y = this.properties.display2Height;
        this.uniforms.display2Size.value.z = -this.properties.display2Distance;

        this.uniforms.pupilSamples.value = this.properties.pupilSamples;
        this.uniforms.pupilDiameter.value = this.properties.pupilDiameter;
        this.uniforms.retinaHeight.value = this.properties.retinaHeight;
        this.uniforms.focalLength.value = this.properties.focalLength;
        this.uniforms.accommodationDistance.value = this.properties.accommodationDistance;
        
        this.uniforms.eyePosition.value.x = this.properties.eyePositionX;
        this.uniforms.eyePosition.value.y = this.properties.eyePositionY;
        this.uniforms.eyePosition.value.z = this.properties.eyePositionZ;
    }
}