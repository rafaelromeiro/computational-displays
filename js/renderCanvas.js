var renderCanvas = {
    renderer: new THREE.WebGLRenderer({preserveDrawingBuffer: true}),
    stats: new Stats(),
    gui: new dat.GUI(),
    renderContent: null,
    lastTimestamp: null,
    lastMouseX: null,
    lastMouseY: null,

    input: {
        deltaX: 0.0,
        deltaY: 0.0,
        deltaWheel: 0.0,

        clear: function () {
            this.deltaX = 0.0;
            this.deltaY = 0.0;
            this.deltaWheel = 0.0;
        }
    },

    setup: function (renderContent) {
        // Get the container html element
        var container = document.getElementById('container');

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // Setup input listeners
        container.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        container.addEventListener('wheel', this.onWheel.bind(this), false);

        // Setup stats
        container.appendChild(this.stats.dom);

        // Setup scene (camera, uniforms, material, geometry, mesh...)
        this.renderContent = renderContent;
        this.renderContent.setup(this);
    },

    onSetupDone: function() {
        // Request first repaint using render
        requestAnimationFrame(this.render.bind(this));
    },

    render: function () {
        newTimestamp = 10;
        // Compute deltaTime with elapsed time since last frame
        if (!this.lastTimestamp) this.lastTimestamp = newTimestamp;
        var deltaTime = newTimestamp - this.lastTimestamp;
        this.lastTimestamp = newTimestamp;

        // Update renderer viewport with window size
        this.renderer.setSize(window.innerWidth, window.innerHeight)

        // Render
        this.renderContent.render(deltaTime, this.input);

        // Update stats
        this.stats.update();

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
            this.input.deltaX -= deltaX;
            this.input.deltaY += deltaY;
        }
    },

    onWheel: function (wheelEvent) {
        this.input.deltaWheel -= wheelEvent.deltaY * 0.001;
    }
}