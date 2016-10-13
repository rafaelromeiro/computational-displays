var renderScene = {
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,

    setup: function (done) {
        // Fetch all the setup resources (shaders...)
        var urls = ['shaders/simulator.vert', 'shaders/simulator.frag']
        var requests = urls.map(url => fetch(url).then(response => response.text()));
        Promise.all(requests).then(resources => { this.onSetupResourcesReady(resources); }).then(done);
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
            displaySize: {type: 'v2', value: new THREE.Vector2(400.0, 400.0)},
            pupilDiameter: {type: 'f', value: 8.0},
            retinaDiameter: {type: 'f', value: 22.0},
            focalLength: {type: 'f', value: 24.0},
            accommodationDistance: {type: 'f', value: 150.0},
            pupilSamples: {type: 'i', value: 4},
            eyePosition: {type: 'v3', value: new THREE.Vector3(0.0, 0.0, 500.0)},
            texture1: { type: "t", value: textureLoader.load('images/lenna.png')}
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
        // Update uniforms
        this.uniforms.deltaTime.value = deltaTime;
        this.uniforms.resolution.value.x = renderer.domElement.width;
        this.uniforms.resolution.value.y = renderer.domElement.height;

        this.uniforms.eyePosition.value.x += input.cameraTruck * 10.0;
        this.uniforms.eyePosition.value.y += input.cameraPedestal * 10.0;

        // Render scene
        renderer.render(this.scene, this.camera);
    }
}