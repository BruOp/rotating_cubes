"use strict";

var Cubes = function() {
  this.sceneIndex = 0;
  this.loadingManager = new THREE.LoadingManager();
  this.requiredExtensions = ['ANGLE_instanced_arrays', 'OES_texture_float'];
  this.isInitialized = false;
  // UTILITY FUNCTIONS

  //This is the entry point, you should call this to kick everything off.
  this.loadAndInitialize = function() {
    var shaderLoader = new ShaderLoader();
    shaderLoader.loadShaders({
      passthrough_vertex: "passthrough/vertex",
      passthrough_fragment: "passthrough/fragment",
      simulation_vertex: "simulation/vertex",
      simulation_fragment : "simulation/fragment",
      cube_vertex: "cubes/vertex",
      cube_fragment: "cubes/fragment",
      debug_vertex: "debug/vertex",
      debug_fragment: "debug/fragment"
    }, "/shaders/", this.init.bind(this) );
  };

  this.setUpGui = function() {
    var gui = new dat.GUI();
    this.waveSim.addGuiFolder(gui);

    var folder = gui.addFolder("Cube Wave");
    folder.add(this.waveUniforms.min_angle, 'value', 0.01, 0.5).name("Minimum Angle");
    folder.add(this.waveUniforms.min_speed, 'value', 0.01, 0.5).name("Minimum Speed");
  }

  this.initRendererAndCheckExtensions = function() {
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: false });
    } catch (e) {
      return false;
    }

    var extensionsAreSupported = [];
    var supportedExtensions = this.renderer.getContext().getSupportedExtensions();

    for (var i = 0; i < this.requiredExtensions.length; i++) {
      for (var j = 0; j < supportedExtensions.length; j++) {
        extensionsAreSupported[i] = false;
        if (this.requiredExtensions[i] === supportedExtensions[j]) {
          extensionsAreSupported[i] = true;
          break;
        }
      }
    }
    return extensionsAreSupported.reduce(function(memo, isSupported) {
      return memo && isSupported;
    });
  }

  this.addDebugPlane = function(scene) {
    var plane = new THREE.PlaneGeometry( this.width/4, this.height/4, 1, 1);
    var planeMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        texture: { type: "t", value: this.waveSim.getCurrentPositionTexture() }
      },
      vertexShader: ShaderLoader.get('debug_vertex'),
      fragmentShader: ShaderLoader.get('debug_fragment'),
      transparent: true
    });
    var planeMesh = new THREE.Mesh( plane, planeMaterial );
    planeMesh.position.z = 2 * this.boxGrid.boxLengthInPixels;
    planeMesh.position.x = this.width/3;
    planeMesh.position.y = this.height/4;
    scene.add( planeMesh );
  }

  // EVENT HANDLERS
  this.addEventListeners = function() {
    window.addEventListener( 'resize', this.onWindowResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  };

  this.onMouseMove = function(event) {
    var mouse = new THREE.Vector2(event.clientX / this.width, 1 - ((event.clientY) / this.height));
    // Need to make it scale properly for arbitrary aspect ratio
    var horizontalScaling = Math.min(this.width / this.height / this.boxGrid.columnRowRatio(), 1.0);
    var verticalScaling = Math.min(this.height / this.width * this.boxGrid.columnRowRatio(), 1.0);
    mouse.x = mouse.x * horizontalScaling + 0.5 * (1 - horizontalScaling);
    mouse.y = mouse.y * verticalScaling + 0.5 * (1 - verticalScaling);
    this.waveSim.changeMousePosition(mouse);
  };

  this.onWindowResize = function( event ) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.boxGrid.adjustBoxLengths(this.width, this.height);

    this.waveUniforms.boxLength.value = this.boxGrid.boxLengthInPixels;

    this.camera.left    = .99 * -.5 * this.width;
    this.camera.right   = .99 *  .5 * this.width;
    this.camera.top     = .99 *  .5 * this.height;
    this.camera.bottom  = .99 * -.5 * this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( this.width, this.height );

    if (this.width < SCREEN_WIDTH_UPPER_LIMITS.medium) {
      this.stopAnimating();
    } else if (this.animationID === undefined) {
      this.animate();
    }
  }

  this.setOnLoad = function(loadCallback) {
    this.loadingManager.onLoad = loadCallback
  }

  // MATERIALS AND UNIFORMS

  this.getTexture = function(textureName) {
    var texture = new THREE.TextureLoader(this.loadingManager).load( '/textures/' + textureName );
    texture.magFilter = THREE.NearestFilter;
  	texture.minFilter = THREE.NearestFilter;

    return texture;
  };

  this.initWaveMaterial = function() {
    var texture = this.getTexture('cubeMap.png');

    this.waveUniforms = {
      rotationField: { type: "t", value: this.waveSim.getCurrentPositionTexture() },
      map: { type: "t", value: texture },
      min_angle: { type: 'f', value: 0.08 },
      min_speed: { type: 'f', value: 0.1 },
      rowCount: { type: "f", value: this.boxGrid.rowCount },
      columnCount: { type: "f", value: this.boxGrid.columnCount },
      boxLength: { type: "f", value: this.boxGrid.boxLengthInPixels },
      time: { type: "f", value: 0.0 }
    };

    return new THREE.RawShaderMaterial({
      uniforms: this.waveUniforms,
      vertexShader: ShaderLoader.get('cube_vertex'),
      fragmentShader: ShaderLoader.get('cube_fragment')
    });
  };

  // INITIALIZATION AND MAIN RENDER LOOP
  this.init = function() {
    this.width  = window.innerWidth;
    this.height = window.innerHeight;

    var waveSimShaderHash = {
      simulation: {
        vertex: ShaderLoader.get('simulation_vertex'),
        fragment: ShaderLoader.get('simulation_fragment')
      },
      passThrough: {
        vertex: ShaderLoader.get('passthrough_vertex'),
        fragment: ShaderLoader.get('passthrough_fragment')
      }
    };

    this.container = document.getElementById( 'webgl-container' );

    this.boxGrid = new InstancedBoxGridGeometry(this.width, this.height);

    this.renderer.setClearColor( new THREE.Color('#222222') );
    // this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.width, this.height );

    this.waveSim = new WaveSim(this.renderer, 2 * this.boxGrid.columnCount, 2 * this.boxGrid.rowCount, waveSimShaderHash);
    this.waveSim.initSceneAndMeshes();

    this.camera = new THREE.OrthographicCamera(
      0.99 * -.5 * this.width,
      0.99 *  .5 * this.width,
      0.99 *  .5 * this.height,
      0.99 * -.5 * this.height,
      1,
      this.boxGrid.boxLengthInPixels * (this.boxGrid.columnCount + this.boxGrid.rowCount + 2) );

    this.camera.position.z = this.boxGrid.boxLengthInPixels * this.boxGrid.rowCount;

    this.scene = new THREE.Scene();

    var geometry = this.boxGrid.geometry;
    // materials
    this.waveMaterial = this.initWaveMaterial();

    this.mesh = new THREE.Mesh( geometry, this.waveMaterial );
    this.scene.add( this.mesh );

    // If you need to debug the simulation FBOs
    this.addDebugPlane(this.scene)

    this.container.appendChild( this.renderer.domElement );
    this.addEventListeners();
    this.isInitialized = true;
    this.setUpGui();
    this.animate();
  };

  this.stopAnimating = function() {
    if (this.animationID != undefined) {
      cancelAnimationFrame( this.animationID );
      this.animationID = undefined;
    }
  }

  this.animate = function() {
    this.animationID = requestAnimationFrame( this.animate.bind(this) );

    this.waveSim.ticktock();
    this.waveSim.setSimUniform('using_mouse', 0);
    this.waveUniforms.time.value += 0.001;
    this.renderer.render( this.scene, this.camera );
  };
};
