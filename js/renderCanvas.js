var renderCanvas = {
    renderer: new THREE.WebGLRenderer(),
    stats: new Stats(),
    renderScene: null,
    lastTimestamp: null,
    lastMouseX: null,
    lastMouseY: null,

    input: {
        cameraTruck: 0.0,
        cameraPedestal: 0.0,
        cameraDolly: 0.0,
        cameraPan: 0.0,
        cameraTilt: 0.0,
        cameraRoll: 0.0,
        cameraFocus: 0.0,

        clear: function () {
            this.cameraTruck = 0.0;
            this.cameraPedestal = 0.0;
            this.cameraDolly = 0.0;
            this.cameraPan = 0.0;
            this.cameraTilt = 0.0;
            this.cameraRoll = 0.0;
            this.cameraFocus = 0.0;
        }
    },

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
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        // Setup input listeners
        container.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        container.addEventListener('wheel', this.onWheel.bind(this), false);

        // Setup scene (camera, uniforms, material, geometry, mesh...)
        this.renderScene = renderScene;
        this.renderScene.setup(this.onSceneSetupDone.bind(this));
    },

    onWindowResize: function () {
        // Update renderer width and height
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    onSceneSetupDone: function() {
        // Request first repaint using render
        requestAnimationFrame(this.render.bind(this));
    },

    render: function (newTimestamp) {
        // Compute deltaTime with elapsed time since last frame
        if (!this.lastTimestamp) this.lastTimestamp = newTimestamp;
        var deltaTime = newTimestamp - this.lastTimestamp;
        this.lastTimestamp = newTimestamp;

        // Render scene monitored by stats
        this.stats.begin();
        this.renderScene.render(this.renderer, deltaTime, this.input);
        this.stats.end();

        // Clear inputs
        this.input.clear();

        // Request next repaint using render
        requestAnimationFrame(this.render.bind(this));
    },

    onMouseMove: function (mouseMoveEvent) {
        if (!this.lastMouseX) this.lastMouseX = mouseMoveEvent.clientX;
        if (!this.lastMouseY) this.lastMouseY = mouseMoveEvent.clientY;
        var deltaX = mouseMoveEvent.clientX - this.lastMouseX;
        var deltaY = mouseMoveEvent.clientY - this.lastMouseY;
        this.lastMouseX = mouseMoveEvent.clientX;
        this.lastMouseY = mouseMoveEvent.clientY;

        if (mouseMoveEvent.buttons & 1) {
            this.input.cameraTruck -= deltaX;
            this.input.cameraPedestal += deltaY;
        }
    },

    onWheel: function (wheelEvent) {
        this.input.cameraFocus += wheelEvent.deltaY;
    }
}