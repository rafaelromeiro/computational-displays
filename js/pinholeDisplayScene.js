var pinholeDisplayScene = {
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    properties: {
        debug: false,
        resolutionWidth: 1024,
        resolutionHeight: 1024,
        displayWidth: 40.0,
        displayHeight: 40.0,
        angularResolution: 80.0,
        displaySpacer: 10.0,
        eyeBoxWidth: 10.0,
        eyeBoxHeight: 10.0,
        eyeDistance: 50.0,

        setupGUI: function (canvas) {
            var f1 = canvas.gui.addFolder('Display Properties');
            f1.add(this, 'debug').listen();
            f1.add(this, 'resolutionWidth').listen();
            f1.add(this, 'resolutionHeight').listen();
            f1.add(this, 'displayWidth').listen();
            f1.add(this, 'displayHeight').listen();
            f1.add(this, 'angularResolution').listen();
            f1.add(this, 'displaySpacer').listen();
            var f2 = canvas.gui.addFolder('Eye Properties');
            f2.add(this, 'eyeBoxWidth').listen();
            f2.add(this, 'eyeBoxHeight').listen();
            f2.add(this, 'eyeDistance').listen();
            var f3 = canvas.gui.addFolder('Actions');
            f3.add(canvas, 'saveScreenshot');
        }
    },

    setup: function (canvas) {
        // Setup GUI
        this.properties.setupGUI(canvas);

        // Fetch all the setup resources (shaders...)
        var urls = ['shaders/basic.vert', 'shaders/pinholeDisplay.frag'];
        var requests = urls.map(url => fetch(url).then(response => response.text()));
        Promise.all(requests).then(resources => { this.onSetupResourcesReady(resources); }).then(canvas.onSceneSetupDone.bind(canvas));
    },

    onSetupResourcesReady: function (resources) {
        // Resources
        var vertexShader = resources[0];
        var fragmentShader = resources[1];
        
        // Setup camera
        this.camera.position.z = 1;

        // Setup uniforms
        var textureLoader = new THREE.TextureLoader();
        this.uniforms = {
            deltaTime: {type: 'f', value: 0.0},
            resolution: {type: 'v2', value: new THREE.Vector2()},
            debug: {type: 'b', value: false},
            eyeSize: {type: 'v2', value: new THREE.Vector2()},
            eyeDistance: {type: 'f', value: 0.0},
            displaySize: {type: 'v2', value: new THREE.Vector2()},
            angularResolution: {type: 'f', value: 0.0},
            displaySpacer: {type: 'f', value: 0.0}
        };

        // Setup material
        var material = new THREE.ShaderMaterial( {
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
        } );

        // Setup geometry
        var geometry = new THREE.PlaneBufferGeometry(2, 2);

        // Setup mesh
        var mesh = new THREE.Mesh(geometry, material);

        // Setup scene
        this.scene.add(mesh);
    },

    render: function (renderer, deltaTime, input) {
        // Force the canvas size
        renderer.setSize(this.properties.resolutionWidth * 2.0, this.properties.resolutionHeight);
        
        // Process input
        this.processInput(deltaTime, input);

        // Update uniforms
        this.updateUniforms(renderer, deltaTime);

        // Render scene
        renderer.render(this.scene, this.camera);
    },

    processInput: function (deltaTime, input) {
        //
    },

    updateUniforms: function (renderer, deltaTime) {
        this.uniforms.deltaTime.value = deltaTime;

        this.uniforms.resolution.value.x = renderer.domElement.width;
        this.uniforms.resolution.value.y = renderer.domElement.height;

        this.uniforms.debug.value = this.properties.debug;

        this.uniforms.eyeSize.value.x = this.properties.eyeBoxWidth;
        this.uniforms.eyeSize.value.y = this.properties.eyeBoxHeight;
        this.uniforms.eyeDistance.value = this.properties.eyeDistance;

        this.uniforms.displaySize.value.x = this.properties.displayWidth;
        this.uniforms.displaySize.value.y = this.properties.displayHeight;
        this.uniforms.angularResolution.value = this.properties.angularResolution;
        this.uniforms.displaySpacer.value = this.properties.displaySpacer;
    }
}