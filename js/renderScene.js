var renderScene = {
    camera: new THREE.Camera(),
    scene: new THREE.Scene(),
    uniforms: null,
    vertexShader: null,
    fragmentShader: null,

    setup: function (done) {
        // Fetch all the setup resources (shaders...)
        Promise.all([
            fetch('shaders/simulator.vert').then((function (response) {console.log('vert'); response.text().then((function (text) {this.vertexShader = text;}).bind(this));}).bind(this)),
            fetch('shaders/simulator.frag').then((function (response) {console.log('frag'); response.text().then((function (text) {this.fragmentShader = text;}).bind(this));}).bind(this))
        ]).then(this.onSetupResourcesReady).then(done).catch(function () {
            alert('Failed to fetch scene setup resources');
        });
    },

    onSetupResourcesReady: function () {
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
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader
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