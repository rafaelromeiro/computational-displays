var simulator = {
    renderer: null,
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    imageExportShader: null,
    observerShader: null,
    lightFieldShader: null,

    displayPhiShader: null,
    displaySqrShader: null,
    displayUpdateShader: null,

    lightFieldRenderTarget: null,

    display1PhiRenderTarget: null,
    display1SqrRenderTarget: null,
    display1RenderTarget: null,

    display2PhiRenderTarget: null,
    display2SqrRenderTarget: null,
    display2RenderTarget: null,

    properties: {
        angularResX: 64.0,
        angularResY: 64.0,
        angularHeight: 50.0,
        angularDistance: 50.0,

        spatialResX: 64.0,
        spatialResY: 64.0,
        spatialHeight: 500.0,
        spatialDistance: 500.0,

        display1ResX: 64.0,
        display1ResY: 64.0,
        display1Height: 50.0,
        display1Distance: 50.0,

        display2ResX: 64.0,
        display2ResY: 64.0,
        display2Height: 500.0,
        display2Distance: 500.0,

        pupilSamples: 256,
        pupilDiameter: 5.0,
        verticalFOV: 60.0,
        focalLength: 17.0,
        accommodationDistance: 500.0,

        eyePositionX: 0.0,
        eyePositionY: 0.0,
        eyePositionZ: 0.0,

        updateLightField: false,
        updateTensorDisplay: false,
        renderMode: 0,
        scene: 0,

        image: -1,

        setupGUI: function (canvas, simulator) {
            var f1 = canvas.gui.addFolder('Light Field Properties');
            f1.add(this, 'angularResX').listen();
            f1.add(this, 'angularResY').listen();
            f1.add(this, 'angularHeight').listen();
            f1.add(this, 'angularDistance').listen();
            f1.add(this, 'spatialResX').listen();
            f1.add(this, 'spatialResY').listen();
            f1.add(this, 'spatialHeight').listen();
            f1.add(this, 'spatialDistance').listen();
            var f2 = canvas.gui.addFolder('Tensor Display Properties');
            f2.add(this, 'display1ResX').listen();
            f2.add(this, 'display1ResY').listen();
            f2.add(this, 'display1Height').listen();
            f2.add(this, 'display1Distance').listen();
            f2.add(this, 'display2ResX').listen();
            f2.add(this, 'display2ResY').listen();
            f2.add(this, 'display2Height').listen();
            f2.add(this, 'display2Distance').listen();
            var f3 = canvas.gui.addFolder('Intrinsic Eye Properties');
            f3.add(this, 'pupilSamples').listen();
            f3.add(this, 'pupilDiameter').listen();
            f3.add(this, 'verticalFOV').listen();
            f3.add(this, 'focalLength').listen();
            f3.add(this, 'accommodationDistance').listen();
            var f4 = canvas.gui.addFolder('Extrinsic Eye Properties');
            f4.add(this, 'eyePositionX').listen();
            f4.add(this, 'eyePositionY').listen();
            f4.add(this, 'eyePositionZ').listen();
            var f5 = canvas.gui.addFolder('Rendering Properties');
            f5.add(this, 'updateLightField').listen();
            f5.add(simulator, 'updateLightField');
            f5.add(this, 'updateTensorDisplay').listen();
            f5.add(simulator, 'updateTensorDisplay');
            f5.add(simulator, 'resetTensorDisplay');
            f5.add(this, 'renderMode', {scene: 0, lightField: 1, tensorDisplay: 2}).listen();
            f5.add(this, 'scene', {spheres: 0, test: 1}).listen();
            var f6 = canvas.gui.addFolder('Export Image');
            f6.add(this, 'image', {screenshot: -1, lightField: 0, display1: 1, display2: 2}).listen();
            f6.add(simulator, 'exportImage');
        }
    },

    setup: function (canvas) {
        // Setup GUI
        this.properties.setupGUI(canvas, this);

        // Get renderer
        this.renderer = canvas.renderer;

        // Fetch all the setup resources (shaders...)
        var urls = ['shaders/basic.vert', 'shaders/header.frag',
                    'shaders/observer.frag', 'shaders/lightField.frag',
                    'shaders/displayPhi.frag', 'shaders/displaySqr.frag',
                    'shaders/displayUpdate.frag', 'shaders/imageExport.frag'];
        var requests = urls.map(url => fetch(url).then(response => response.text()));
        Promise.all(requests).then(resources => { this.onSetupResourcesReady(resources); }).then(canvas.onSetupDone.bind(canvas));
    },

    setupShader: function (vertexShader, fragmentShader) {
        return new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        } );
    },

    onSetupResourcesReady: function (resources) {
        // Resources
        var vertexShader = resources[0];
        var headerFragmentShader = resources[1];
        var observerFragmentShader = headerFragmentShader.concat(resources[2]);
        var lightFieldFragmentShader = headerFragmentShader.concat(resources[3]);
        var displayPhiFragmentShader = headerFragmentShader.concat(resources[4]);
        var displaySqrFragmentShader = headerFragmentShader.concat(resources[5]);
        var displayUpdateFragmentShader = headerFragmentShader.concat(resources[6]);
        var imageExportFragmentShader = headerFragmentShader.concat(resources[7]);
        
        // Setup camera (Fixed quad-viewing camera, not our ray-casting camera)
        this.camera.position.z = 1;

        // Setup render targets
        this.lightFieldRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.display1PhiRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestMipMapNearestFilter, magFilter: THREE.NearestFilter});
        this.display1SqrRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestMipMapNearestFilter, magFilter: THREE.NearestFilter});
        this.display1RenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.display2PhiRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestMipMapNearestFilter, magFilter: THREE.NearestFilter});
        this.display2SqrRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestMipMapNearestFilter, magFilter: THREE.NearestFilter});
        this.display2RenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});

        // Setup uniforms
        var textureLoader = new THREE.TextureLoader();
        this.uniforms = {
            resolution: {type: 'v2', value: new THREE.Vector2()},
            currentDisplayUpdate: {type: 'i', value: 1},
            imageExport: {type: 'i', value: 0},

            angularResolution: {type: 'v2', value: new THREE.Vector2()},
            spatialResolution: {type: 'v2', value: new THREE.Vector2()},
            angularSize: {type: 'v3', value: new THREE.Vector3()},
            spatialSize: {type: 'v3', value: new THREE.Vector3()},

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

            renderMode: {type: 'i', value: 0},
            scene: {type: 'i', value: 0},

            lightField: {type: "t", value: this.lightFieldRenderTarget.texture},

            display1Phi: {type: "t", value: this.display1PhiRenderTarget.texture},
            display1Sqr: {type: "t", value: this.display1SqrRenderTarget.texture},
            display1: {type: "t", value: this.display1RenderTarget.texture},

            display2Phi: {type: "t", value: this.display2PhiRenderTarget.texture},
            display2Sqr: {type: "t", value: this.display2SqrRenderTarget.texture},
            display2: {type: "t", value: this.display2RenderTarget.texture}
        };

        // Setup shader materials
        this.observerShader = this.setupShader(vertexShader, observerFragmentShader);
        this.lightFieldShader = this.setupShader(vertexShader, lightFieldFragmentShader);
        this.displayPhiShader = this.setupShader(vertexShader, displayPhiFragmentShader);
        this.displaySqrShader = this.setupShader(vertexShader, displaySqrFragmentShader);
        this.displayUpdateShader = this.setupShader(vertexShader, displayUpdateFragmentShader);
        this.imageExportShader = this.setupShader(vertexShader, imageExportFragmentShader);

        // Enable GL_EXT_shader_texture_lod extension
        this.displayUpdateShader.extensions.shaderTextureLOD = true;

        // Setup scene with a quad mesh covering whole viewport
        this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2)));

        // Setup tensor display random initial content
        this.resetTensorDisplay();
    },

    render: function (deltaTime, input) {
        // Process input
        this.processInput(deltaTime, input);

        // Update uniforms
        this.updateUniforms();

        // Update light field
        if (this.properties.updateLightField)
            this.updateLightField();

        // Update tensor display
        if (this.properties.updateTensorDisplay)
            this.updateTensorDisplay();

        // Render to screen the observed image
        this.scene.overrideMaterial = this.observerShader;
        this.renderer.render(this.scene, this.camera);
    },

    updateLightField: function () {
        var lightFieldResX = this.properties.angularResX * this.properties.spatialResX;
        var lightFieldResY = this.properties.angularResY * this.properties.spatialResY;
        this.lightFieldRenderTarget.setSize(lightFieldResX, lightFieldResY);
        
        this.scene.overrideMaterial = this.lightFieldShader;
        this.renderer.render(this.scene, this.camera, this.lightFieldRenderTarget);
    },

    updateTensorDisplay: function () {
        var phiResX = this.properties.display1ResX * this.properties.display2ResX;
        var phiResY = this.properties.display1ResY * this.properties.display2ResY;

        // Update display 1
        this.uniforms.currentDisplayUpdate.value = 2;
        this.scene.overrideMaterial = this.displayPhiShader;
        this.display2PhiRenderTarget.setSize(phiResX, phiResY);
        this.renderer.render(this.scene, this.camera, this.display2PhiRenderTarget);
        this.scene.overrideMaterial = this.displaySqrShader;
        this.display2SqrRenderTarget.setSize(this.properties.display2ResX, this.properties.display2ResY);
        this.renderer.render(this.scene, this.camera, this.display2SqrRenderTarget);
        this.uniforms.currentDisplayUpdate.value = 1;
        this.scene.overrideMaterial = this.displayUpdateShader;
        this.display1RenderTarget.setSize(this.properties.display1ResX, this.properties.display1ResY);
        this.renderer.render(this.scene, this.camera, this.display1RenderTarget);

        // Update display 2
        this.uniforms.currentDisplayUpdate.value = 1;
        this.scene.overrideMaterial = this.displayPhiShader;
        this.display1PhiRenderTarget.setSize(phiResX, phiResY);
        this.renderer.render(this.scene, this.camera, this.display1PhiRenderTarget);
        this.scene.overrideMaterial = this.displaySqrShader;
        this.display1SqrRenderTarget.setSize(this.properties.display1ResX, this.properties.display1ResY);
        this.renderer.render(this.scene, this.camera, this.display1SqrRenderTarget);
        this.uniforms.currentDisplayUpdate.value = 2;
        this.scene.overrideMaterial = this.displayUpdateShader;
        this.display2RenderTarget.setSize(this.properties.display2ResX, this.properties.display2ResY);
        this.renderer.render(this.scene, this.camera, this.display2RenderTarget);
    },

    resetTensorDisplay: function () {
        this.uniforms.currentDisplayUpdate.value = 0;

        this.display1RenderTarget.setSize(this.properties.display1ResX, this.properties.display1ResY);
        this.display2RenderTarget.setSize(this.properties.display2ResX, this.properties.display2ResY);

        this.scene.overrideMaterial = this.displayUpdateShader;
        this.renderer.render(this.scene, this.camera, this.display1RenderTarget);
        this.renderer.render(this.scene, this.camera, this.display2RenderTarget);
    },

    processInput: function (deltaTime, input) {
        this.properties.eyePositionX += input.deltaX;
        this.properties.eyePositionY += input.deltaY;

        this.properties.accommodationDistance += input.deltaWheel * 100.0;
    },

    updateUniforms: function () {
        this.uniforms.resolution.value.x = this.renderer.domElement.width;
        this.uniforms.resolution.value.y = this.renderer.domElement.height;
        this.uniforms.imageExport.value = this.properties.image;

        this.uniforms.angularResolution.value.x = this.properties.angularResX;
        this.uniforms.angularResolution.value.y = this.properties.angularResY;
        this.uniforms.spatialResolution.value.x = this.properties.spatialResX;
        this.uniforms.spatialResolution.value.y = this.properties.spatialResY;

        var angularAspect = this.properties.angularResX / this.properties.angularResY;
        var spatialAspect = this.properties.spatialResX / this.properties.spatialResY;

        this.uniforms.angularSize.value.x = this.properties.angularHeight * angularAspect;
        this.uniforms.angularSize.value.y = this.properties.angularHeight;
        this.uniforms.angularSize.value.z = -this.properties.angularDistance;
        this.uniforms.spatialSize.value.x = this.properties.spatialHeight * spatialAspect;
        this.uniforms.spatialSize.value.y = this.properties.spatialHeight;
        this.uniforms.spatialSize.value.z = -this.properties.spatialDistance;

        this.uniforms.display1Resolution.value.x = this.properties.display1ResX;
        this.uniforms.display1Resolution.value.y = this.properties.display1ResY;
        this.uniforms.display2Resolution.value.x = this.properties.display2ResX;
        this.uniforms.display2Resolution.value.y = this.properties.display2ResY;

        var display1Aspect = this.properties.display1ResX / this.properties.display1ResY;
        var display2Aspect = this.properties.display2ResX / this.properties.display2ResY;

        this.uniforms.display1Size.value.x = this.properties.display1Height * display1Aspect;
        this.uniforms.display1Size.value.y = this.properties.display1Height;
        this.uniforms.display1Size.value.z = -this.properties.display1Distance;
        this.uniforms.display2Size.value.x = this.properties.display2Height * display2Aspect;
        this.uniforms.display2Size.value.y = this.properties.display2Height;
        this.uniforms.display2Size.value.z = -this.properties.display2Distance;

        var halfAngle = this.properties.verticalFOV * Math.PI / 360.0;
        var retinaHeight = 2.0 * this.properties.focalLength * Math.tan(halfAngle);

        this.uniforms.pupilSamples.value = this.properties.pupilSamples;
        this.uniforms.pupilDiameter.value = this.properties.pupilDiameter;
        this.uniforms.retinaHeight.value = retinaHeight;
        this.uniforms.focalLength.value = this.properties.focalLength;
        this.uniforms.accommodationDistance.value = this.properties.accommodationDistance;
        
        this.uniforms.eyePosition.value.x = this.properties.eyePositionX;
        this.uniforms.eyePosition.value.y = this.properties.eyePositionY;
        this.uniforms.eyePosition.value.z = this.properties.eyePositionZ;

        this.uniforms.renderMode.value = this.properties.renderMode;
        this.uniforms.scene.value = this.properties.scene;
    },

    exportImage: function() {
        if (this.properties.image >= 0) {
            image = [this.lightFieldRenderTarget, this.display1RenderTarget, this.display2RenderTarget][this.properties.image];
            this.renderer.setSize(image.width, image.height);
            this.updateUniforms();
            this.scene.overrideMaterial = this.imageExportShader;
            this.renderer.render(this.scene, this.camera);
        }

        window.open( this.renderer.domElement.toDataURL( 'image/png' ), 'image' );
    }
}