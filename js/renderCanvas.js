var renderCanvas = {
    renderer: new THREE.WebGLRenderer(),
    stats: new Stats(),
    lastTimestamp: null,
    renderScene: null,

    setup: function (renderScene) {
        // Get the container html element
        var container = document.getElementById('container');

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);

        // Setup stats
        container.appendChild(this.stats.dom);

        // Register window resize callback
        this.onWindowResize();
        window.addEventListener('resize', this.onWindowResize, false);

        // Setup scene (camera, uniforms, material, geometry, mesh...)
        this.renderScene = renderScene;
        this.renderScene.setup(this.onSceneSetupDone);
    },

    onWindowResize: function () {
        // Update renderer width and height
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    onSceneSetupDone: function() {
        // Request first repaint using render
        requestAnimationFrame(this.render);
    },

    render: function () {
        // Compute deltaTime with elapsed time since last frame
        if (!lastTimestamp) lastTimestamp = newTimestamp;
        var deltaTime = newTimestamp - lastTimestamp;
        lastTimestamp = newTimestamp;

        // Render scene monitored by stats
        this.stats.begin();
        this.renderScene.render(this.renderer, deltaTime);
        this.stats.end();

        // Request next repaint using render
        requestAnimationFrame(this.render);
    }
}