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
        this.uniforms = {
            deltaTime: {type: 'f', value: 0.0},
            resolution: {type: 'v2', value: new THREE.Vector2()}
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

    render: function (renderer, deltaTime) {
        // Update uniforms
        this.uniforms.deltaTime.value = deltaTime;
        this.uniforms.resolution.value.x = renderer.domElement.width;
        this.uniforms.resolution.value.y = renderer.domElement.height;

        // Render scene
        renderer.render(this.scene, this.camera);
    }
}