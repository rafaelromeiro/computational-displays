var renderCanvas = {
    renderer: new THREE.WebGLRenderer({preserveDrawingBuffer: true}),
    stats: new Stats(),
    gui: new dat.GUI(),
    renderScene: null,
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

    setup: function (renderScene) {
        // Get the container html element
        var container = document.getElementById('container');

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(this.renderer.domElement);

        // Register window resize callback
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

        // Setup input listeners
        container.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        container.addEventListener('wheel', this.onWheel.bind(this), false);

        // Setup stats
        container.appendChild(this.stats.dom);

        // Setup scene (camera, uniforms, material, geometry, mesh...)
        this.renderScene = renderScene;
        this.renderScene.setup(this);
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
            this.input.deltaX -= deltaX;
            this.input.deltaY += deltaY;
        }
    },

    onWheel: function (wheelEvent) {
        this.input.deltaWheel -= wheelEvent.deltaY * 0.001;
    },

    saveScreenshot: function () {
        var imgData, imgNode;
        try {
            var strMime = "image/png";
            imgData = this.renderer.domElement.toDataURL(strMime);
            
            this.saveFile(imgData.replace(strMime, "image/octet-stream"), "screenshot.png");
        } catch (e) {
            console.log(e);
            return;
        }
    },

    saveFile: function (strData, filename) {
        var link = document.createElement('a');
        if (typeof link.download === 'string') {
            document.body.appendChild(link);
            link.download = filename;
            link.href = strData;
            link.click();
            document.body.removeChild(link);
        } else {
            location.replace(uri);
        }
    }
}