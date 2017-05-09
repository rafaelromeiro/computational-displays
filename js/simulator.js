var simulator = {
    renderer: null,
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    imageExportShader: null,
    observerShader: null,
    lightFieldShader: null,
    tensorFieldShader: null,
    display1UpdateShader: null,
    display2UpdateShader: null,
    displayResetShader: null,

    lightFieldRenderTarget: null,
    tensorFieldRenderTarget: null,
    display1RenderTarget: null,
    display2RenderTarget: null,

    properties: {
        angularResX: 5.0,
        angularResY: 5.0,
        angularHeight: 5.0,
        angularDistance: 0.00001,

        spatialResX: 800.0,
        spatialResY: 640.0,
        spatialHeight: 5000.0,
        spatialDistance: 4000.0,

        display1ResX: 1280.0,
        display1ResY: 800.0,
        display1Height: 3.86 * 45,
        display1Distance: 190.0, 

        display2ResX: 1280.0,
        display2ResY: 800.0,
        display2Height: 25.0 * 45,
        display2Distance: 1230.0,

        pupilSamples: 256,
        pupilDiameter: 5.0,
        verticalFOV: 60.0,
        focalLength: 17.0,
        accommodationDistance: 200.0,

        eyePositionX: 0.0,
        eyePositionY: 0.0,
        eyePositionZ: 0.0,

        updateLightField: false,
        updateTensorDisplay: false,
        renderMode: 0,
        scene: 0,
        interpolationMode: 0,

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
            f5.add(this, 'interpolationMode', {Nearest: 0, Quadrilinear: 1}).listen();
            var f6 = canvas.gui.addFolder('Export Image');
            f6.add(this, 'image', {screenshot: -1, lightField: 0, display1: 1, display2: 2, tensorField: 3}).listen();
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
                    'shaders/observer.frag', 'shaders/imageExport.frag',
                    'shaders/lightField.frag', 'shaders/tensorField.frag',
                    'shaders/display1Update.frag', 'shaders/display2Update.frag',
                    'shaders/displayReset.frag'];
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
        var imageExportFragmentShader = headerFragmentShader.concat(resources[3]);
        var lightFieldFragmentShader = headerFragmentShader.concat(resources[4]);
        var tensorFieldFragmentShader = headerFragmentShader.concat(resources[5]);
        var display1UpdateFragmentShader = headerFragmentShader.concat(resources[6]);
        var display2UpdateFragmentShader = headerFragmentShader.concat(resources[7]);
        var displayResetFragmentShader = headerFragmentShader.concat(resources[8]);
        
        // Setup camera (Fixed quad-viewing camera, not our ray-casting camera)
        this.camera.position.z = 1;

        // Setup render targets
        this.lightFieldRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.tensorFieldRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.display1RenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.display2RenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});

        // Setup uniforms
        var textureLoader = new THREE.TextureLoader();
        this.uniforms = {
            resolution: {type: 'v2', value: new THREE.Vector2()},
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
            interpolationMode: {type: 'i', value: 0},

            lightField: {type: "t", value: this.lightFieldRenderTarget.texture},
            tensorField: {type: "t", value: this.tensorFieldRenderTarget.texture},
            display1: {type: "t", value: this.display1RenderTarget.texture},
            display2: {type: "t", value: this.display2RenderTarget.texture}
        };

        // Setup shader materials
        this.observerShader = this.setupShader(vertexShader, observerFragmentShader);
        this.imageExportShader = this.setupShader(vertexShader, imageExportFragmentShader);
        this.lightFieldShader = this.setupShader(vertexShader, lightFieldFragmentShader);
        this.tensorFieldShader = this.setupShader(vertexShader, tensorFieldFragmentShader);
        this.display1UpdateShader = this.setupShader(vertexShader, display1UpdateFragmentShader);
        this.display2UpdateShader = this.setupShader(vertexShader, display2UpdateFragmentShader);
        this.displayResetShader = this.setupShader(vertexShader, displayResetFragmentShader);

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
        this.tensorFieldRenderTarget.setSize(lightFieldResX, lightFieldResY);
        
        this.scene.overrideMaterial = this.lightFieldShader;
        this.renderer.render(this.scene, this.camera, this.lightFieldRenderTarget);
    },

    resetTensorDisplay: function () {
        this.display1RenderTarget.setSize(this.properties.display1ResX, this.properties.display1ResY);
        this.display2RenderTarget.setSize(this.properties.display2ResX, this.properties.display2ResY);

        this.scene.overrideMaterial = this.displayResetShader;
        this.renderer.render(this.scene, this.camera, this.display1RenderTarget);
        this.renderer.render(this.scene, this.camera, this.display2RenderTarget);
    },

    updateTensorDisplay: function () {
        // Update tensor field
        this.scene.overrideMaterial = this.tensorFieldShader;
        this.renderer.render(this.scene, this.camera, this.tensorFieldRenderTarget);

        // Update display 1
        this.scene.overrideMaterial = this.display1UpdateShader;
        this.renderer.render(this.scene, this.camera, this.display1RenderTarget);

        // Update tensor field (again)
        this.scene.overrideMaterial = this.tensorFieldShader;
        this.renderer.render(this.scene, this.camera, this.tensorFieldRenderTarget);

        // Update display 2
        this.scene.overrideMaterial = this.display2UpdateShader;
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
        this.uniforms.interpolationMode.value = this.properties.interpolationMode;
    },

    exportImage: function() {
        if (this.properties.image >= 0) {
            image = [this.lightFieldRenderTarget, this.display1RenderTarget, this.display2RenderTarget, this.tensorFieldRenderTarget][this.properties.image];
            this.renderer.setSize(image.width, image.height);
            this.updateUniforms();
            this.scene.overrideMaterial = this.imageExportShader;
            this.renderer.render(this.scene, this.camera);
        }

        window.open( this.renderer.domElement.toDataURL( 'image/png' ), 'image' );
    }
}