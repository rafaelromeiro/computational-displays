var simulatorScene = {
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    properties: {
        displayWidth: 40.0,
        displayHeight: 40.0,
        displaySpacer: 10.0,
        pupilDiameter: 8.0,
        retinaDiameter: 22.0,
        focalLength: 24.0,
        accommodationDistance: 50.0,
        pupilSamples: 64,
        eyeDistance: 50.0,
        eyeDistanceLocked: true,
        eyePositionX: 0.0,
        eyePositionY: 0.0,
        eyePositionZ: 50.0,

        setupGUI: function (canvas) {
            var f1 = canvas.gui.addFolder('Display Properties');
            f1.add(this, 'displayWidth').listen();
            f1.add(this, 'displayHeight').listen();
            f1.add(this, 'displaySpacer').listen();
            var f2 = canvas.gui.addFolder('Intrinsic Eye Properties');
            f2.add(this, 'pupilDiameter').listen();
            f2.add(this, 'retinaDiameter').listen();
            f2.add(this, 'focalLength').listen();
            f2.add(this, 'pupilSamples').listen();
            var f3 = canvas.gui.addFolder('Extrinsic Eye Properties');
            f3.add(this, 'accommodationDistance').listen();
            f3.add(this, 'eyeDistance').listen();
            f3.add(this, 'eyeDistanceLocked').listen();
            f3.add(this, 'eyePositionX').listen();
            f3.add(this, 'eyePositionY').listen();
            f3.add(this, 'eyePositionZ').listen();
            var f4 = canvas.gui.addFolder('Actions');
            f4.add(canvas, 'saveScreenshot');
        }
    },

    setup: function (canvas) {
        // Setup GUI
        this.properties.setupGUI(canvas);

        // Fetch all the setup resources (shaders...)
        var urls = ['shaders/basic.vert', 'shaders/simulator.frag'];
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
            displaySize: {type: 'v2', value: new THREE.Vector2()},
            displaySpacer: {type: 'f', value: 0.0},
            pupilDiameter: {type: 'f', value: 0.0},
            retinaDiameter: {type: 'f', value: 0.0},
            focalLength: {type: 'f', value: 0.0},
            accommodationDistance: {type: 'f', value: 0.0},
            pupilSamples: {type: 'i', value: 0},
            eyePosition: {type: 'v3', value: new THREE.Vector3()},
            lenna: { type: "t", value: textureLoader.load('images/lenna.png')},
            baboon: { type: "t", value: textureLoader.load('images/baboon.png')},
            pinholes: { type: "t", value: textureLoader.load('images/pinholes.png')},
            views: { type: "t", value: textureLoader.load('images/views.png')}
        };
        this.uniforms.pinholes.value.magFilter = THREE.NearestFilter;
        this.uniforms.pinholes.value.minFilter = THREE.NearestFilter;

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
        // Process input
        this.processInput(deltaTime, input);

        // Update uniforms
        this.updateUniforms(renderer, deltaTime);

        // Render scene
        renderer.render(this.scene, this.camera);
    },

    processInput: function (deltaTime, input) {
        var eyePosition = new THREE.Vector3(this.properties.eyePositionX,
                                            this.properties.eyePositionY,
                                            this.properties.eyePositionZ);

        eyePosition.x += input.deltaX;
        eyePosition.y += input.deltaY;

        if (this.properties.eyeDistanceLocked) {
            eyePosition.normalize();
            eyePosition.multiplyScalar(this.properties.eyeDistance);
        }
        else this.properties.eyeDistance = eyePosition.length();

        this.properties.eyePositionX = eyePosition.x;
        this.properties.eyePositionY = eyePosition.y;
        this.properties.eyePositionZ = eyePosition.z;

        this.properties.accommodationDistance += input.deltaWheel;
    },

    updateUniforms: function (renderer, deltaTime) {
        this.uniforms.deltaTime.value = deltaTime;

        this.uniforms.resolution.value.x = renderer.domElement.width;
        this.uniforms.resolution.value.y = renderer.domElement.height;

        this.uniforms.displaySize.value.x = this.properties.displayWidth;
        this.uniforms.displaySize.value.y = this.properties.displayHeight;
        this.uniforms.displaySpacer.value = this.properties.displaySpacer;

        this.uniforms.pupilDiameter.value = this.properties.pupilDiameter;
        this.uniforms.retinaDiameter.value = this.properties.retinaDiameter;
        this.uniforms.focalLength.value = this.properties.focalLength;
        this.uniforms.accommodationDistance.value = this.properties.accommodationDistance;
        this.uniforms.pupilSamples.value = this.properties.pupilSamples;
        
        this.uniforms.eyePosition.value.x = this.properties.eyePositionX;
        this.uniforms.eyePosition.value.y = this.properties.eyePositionY;
        this.uniforms.eyePosition.value.z = this.properties.eyePositionZ;
    }
}