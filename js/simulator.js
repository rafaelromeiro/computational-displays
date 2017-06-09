var simulator = {
    renderer: null,
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    imageExportShader: null,
    observerShader: null,
    sampledLightFieldShader: null,
    displayLightFieldShader: null,
    frontPanelUpdateShader: null,
    rearPanelUpdateShader: null,
    panelResetShader: null,

    sampledLightFieldRenderTarget: null,
    displayLightFieldRenderTarget: null,
    frontPanelRenderTarget: null,
    rearPanelRenderTarget: null,

    properties: {
        spatialResX: 64.0,
        spatialResY: 64.0,
        spatialHeight: 10.0,
        spatialDistance: 0.0,

        angularResX: 256.0,
        angularResY: 256.0,
        angularHeight: 40.0,
        angularDistance: 40.0,

        frontPanelResX: 64.0,
        frontPanelResY: 64.0,
        frontPanelHeight: 10.0,
        frontPanelDistance: 0.0, 

        rearPanelResX: 256.0,
        rearPanelResY: 256.0,
        rearPanelHeight: 40.0,
        rearPanelDistance: 40.0,

        pupilSamples: 256,
        pupilDiameter: 5.0,
        verticalFOV: 60.0,
        focalLength: 17.0,
        accommodationDistance: 200.0,

        eyePositionX: 0.0,
        eyePositionY: 0.0,
        eyePositionZ: 0.0,

        updateLightField: false,
        updateDisplay: false,
        renderMode: 0,
        scene: 0,
        interpolationMode: 0,

        image: -1,

        setupGUI: function (canvas, simulator) {
            var f1 = canvas.gui.addFolder('Light Field Properties');
            f1.add(this, 'spatialResX').listen();
            f1.add(this, 'spatialResY').listen();
            f1.add(this, 'spatialHeight').listen();
            f1.add(this, 'spatialDistance').listen();
            f1.add(this, 'angularResX').listen();
            f1.add(this, 'angularResY').listen();
            f1.add(this, 'angularHeight').listen();
            f1.add(this, 'angularDistance').listen();
            var f2 = canvas.gui.addFolder('Tensor Display Properties');
            f2.add(this, 'frontPanelResX').listen();
            f2.add(this, 'frontPanelResY').listen();
            f2.add(this, 'frontPanelHeight').listen();
            f2.add(this, 'frontPanelDistance').listen();
            f2.add(this, 'rearPanelResX').listen();
            f2.add(this, 'rearPanelResY').listen();
            f2.add(this, 'rearPanelHeight').listen();
            f2.add(this, 'rearPanelDistance').listen();
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
            f5.add(this, 'updateDisplay').listen();
            f5.add(simulator, 'updateDisplay');
            f5.add(simulator, 'resetDisplay');
            f5.add(this, 'renderMode', {scene: 0, lightField: 1, display: 2}).listen();
            f5.add(this, 'scene', {spheres: 0, test: 1}).listen();
            f5.add(this, 'interpolationMode', {Nearest: 0, Quadrilinear: 1}).listen();
            var f6 = canvas.gui.addFolder('Export Image');
            f6.add(this, 'image', {screenshot: -1, sampledLightField: 0, frontPanel: 1, rearPanel: 2, displayLightField: 3}).listen();
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
                    'shaders/sampledLightField.frag', 'shaders/displayLightField.frag',
                    'shaders/frontPanelUpdate.frag', 'shaders/rearPanelUpdate.frag',
                    'shaders/panelReset.frag'];
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
        var sampledLightFieldFragmentShader = headerFragmentShader.concat(resources[4]);
        var displayLightFieldFragmentShader = headerFragmentShader.concat(resources[5]);
        var frontPanelUpdateFragmentShader = headerFragmentShader.concat(resources[6]);
        var rearPanelUpdateFragmentShader = headerFragmentShader.concat(resources[7]);
        var panelResetFragmentShader = headerFragmentShader.concat(resources[8]);
        
        // Setup camera (Fixed quad-viewing camera, not our ray-casting camera)
        this.camera.position.z = 1;

        // Setup render targets
        this.sampledLightFieldRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.displayLightFieldRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.frontPanelRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});
        this.rearPanelRenderTarget = new THREE.WebGLRenderTarget(2, 2, {minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter});

        // Setup uniforms
        var textureLoader = new THREE.TextureLoader();
        this.uniforms = {
            resolution: {type: 'v2', value: new THREE.Vector2()},
            imageExport: {type: 'i', value: 0},

            spatialResolution: {type: 'v2', value: new THREE.Vector2()},
            angularResolution: {type: 'v2', value: new THREE.Vector2()},
            spatialSize: {type: 'v3', value: new THREE.Vector3()},
            angularSize: {type: 'v3', value: new THREE.Vector3()},

            frontPanelResolution: {type: 'v2', value: new THREE.Vector2()},
            rearPanelResolution: {type: 'v2', value: new THREE.Vector2()},
            frontPanelSize: {type: 'v3', value: new THREE.Vector3()},
            rearPanelSize: {type: 'v3', value: new THREE.Vector3()},

            pupilSamples: {type: 'i', value: 0},
            pupilDiameter: {type: 'f', value: 0.0},
            retinaHeight: {type: 'f', value: 0.0},
            focalLength: {type: 'f', value: 0.0},
            accommodationDistance: {type: 'f', value: 0.0},

            eyePosition: {type: 'v3', value: new THREE.Vector3()},

            renderMode: {type: 'i', value: 0},
            scene: {type: 'i', value: 0},
            interpolationMode: {type: 'i', value: 0},

            sampledLightField: {type: "t", value: this.sampledLightFieldRenderTarget.texture},
            displayLightField: {type: "t", value: this.displayLightFieldRenderTarget.texture},
            frontPanel: {type: "t", value: this.frontPanelRenderTarget.texture},
            rearPanel: {type: "t", value: this.rearPanelRenderTarget.texture}
        };

        // Setup shader materials
        this.observerShader = this.setupShader(vertexShader, observerFragmentShader);
        this.imageExportShader = this.setupShader(vertexShader, imageExportFragmentShader);
        this.sampledLightFieldShader = this.setupShader(vertexShader, sampledLightFieldFragmentShader);
        this.displayLightFieldShader = this.setupShader(vertexShader, displayLightFieldFragmentShader);
        this.frontPanelUpdateShader = this.setupShader(vertexShader, frontPanelUpdateFragmentShader);
        this.rearPanelUpdateShader = this.setupShader(vertexShader, rearPanelUpdateFragmentShader);
        this.panelResetShader = this.setupShader(vertexShader, panelResetFragmentShader);

        // Setup scene with a quad mesh covering whole viewport
        this.scene.add(new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2)));

        // Setup tensor display random initial content
        this.resetDisplay();
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
        if (this.properties.updateDisplay)
            this.updateDisplay();

        // Render to screen the observed image
        this.scene.overrideMaterial = this.observerShader;
        this.renderer.render(this.scene, this.camera);
    },

    updateLightField: function () {
        var lightFieldResX = this.properties.angularResX * this.properties.spatialResX;
        var lightFieldResY = this.properties.angularResY * this.properties.spatialResY;

        this.sampledLightFieldRenderTarget.setSize(lightFieldResX, lightFieldResY);
        this.displayLightFieldRenderTarget.setSize(lightFieldResX, lightFieldResY);
        
        this.scene.overrideMaterial = this.sampledLightFieldShader;
        this.renderer.render(this.scene, this.camera, this.sampledLightFieldRenderTarget);
    },

    resetDisplay: function () {
        this.frontPanelRenderTarget.setSize(this.properties.frontPanelResX, this.properties.frontPanelResY);
        this.rearPanelRenderTarget.setSize(this.properties.rearPanelResX, this.properties.rearPanelResY);

        this.scene.overrideMaterial = this.panelResetShader;
        this.renderer.render(this.scene, this.camera, this.frontPanelRenderTarget);
        this.renderer.render(this.scene, this.camera, this.rearPanelRenderTarget);
    },

    updateDisplay: function () {
        // Update display light field
        this.scene.overrideMaterial = this.displayLightFieldShader;
        this.renderer.render(this.scene, this.camera, this.displayLightFieldRenderTarget);

        // Update front panel
        this.scene.overrideMaterial = this.frontPanelUpdateShader;
        this.renderer.render(this.scene, this.camera, this.frontPanelRenderTarget);

        // Update display light field (again)
        this.scene.overrideMaterial = this.displayLightFieldShader;
        this.renderer.render(this.scene, this.camera, this.displayLightFieldRenderTarget);

        // Update rear panel
        this.scene.overrideMaterial = this.rearPanelUpdateShader;
        this.renderer.render(this.scene, this.camera, this.rearPanelRenderTarget);
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

        this.uniforms.spatialResolution.value.x = this.properties.spatialResX;
        this.uniforms.spatialResolution.value.y = this.properties.spatialResY;
        this.uniforms.angularResolution.value.x = this.properties.angularResX;
        this.uniforms.angularResolution.value.y = this.properties.angularResY;

        var spatialAspect = this.properties.spatialResX / this.properties.spatialResY;
        var angularAspect = this.properties.angularResX / this.properties.angularResY;

        this.uniforms.spatialSize.value.x = this.properties.spatialHeight * spatialAspect;
        this.uniforms.spatialSize.value.y = this.properties.spatialHeight;
        this.uniforms.spatialSize.value.z = -this.properties.spatialDistance;
        this.uniforms.angularSize.value.x = this.properties.angularHeight * angularAspect;
        this.uniforms.angularSize.value.y = this.properties.angularHeight;
        this.uniforms.angularSize.value.z = -this.properties.angularDistance;

        this.uniforms.frontPanelResolution.value.x = this.properties.frontPanelResX;
        this.uniforms.frontPanelResolution.value.y = this.properties.frontPanelResY;
        this.uniforms.rearPanelResolution.value.x = this.properties.rearPanelResX;
        this.uniforms.rearPanelResolution.value.y = this.properties.rearPanelResY;

        var frontPanelAspect = this.properties.frontPanelResX / this.properties.frontPanelResY;
        var rearPanelAspect = this.properties.rearPanelResX / this.properties.rearPanelResY;

        this.uniforms.frontPanelSize.value.x = this.properties.frontPanelHeight * frontPanelAspect;
        this.uniforms.frontPanelSize.value.y = this.properties.frontPanelHeight;
        this.uniforms.frontPanelSize.value.z = -this.properties.frontPanelDistance;
        this.uniforms.rearPanelSize.value.x = this.properties.rearPanelHeight * rearPanelAspect;
        this.uniforms.rearPanelSize.value.y = this.properties.rearPanelHeight;
        this.uniforms.rearPanelSize.value.z = -this.properties.rearPanelDistance;

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
            image = [this.sampledLightFieldRenderTarget, this.frontPanelRenderTarget, this.rearPanelRenderTarget,
                     this.displayLightFieldRenderTarget][this.properties.image];
            this.renderer.setSize(image.width, image.height);
            this.updateUniforms();
            this.scene.overrideMaterial = this.imageExportShader;
            this.renderer.render(this.scene, this.camera);
        }

        window.open( this.renderer.domElement.toDataURL( 'image/png' ), 'image' );
    }
}