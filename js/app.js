"use strict";

var Cubes = function() {
  this.scenes = [
    { final_scroll_value: 0.5 },
    { final_scroll_value: 1.0 },
    { final_scroll_value: 0.5 }
  ];
  this.sceneIndex = 0;
  
  this.onLoad = function() {
    var shaderLoader = new ShaderLoader();
    shaderLoader.loadShaders({
      passthrough_vertex: "passthrough/vertex",
      passthrough_fragment: "passthrough/fragment",
      simulation_vertex: "simulation/vertex",
      simulation_fragment : "simulation/fragment",
      scrolling_vertex: "scrolling/vertex",
      scrolling_fragment: "scrolling/fragment",
      cube_vertex: "cubes/vertex",
      cube_fragment: "cubes/fragment",
      scrolling_cube_vertex: "scrolling_cubes/vertex",
      scrolling_cube_fragment: "scrolling_cubes/fragment",
      debug_vertex: "debug/vertex",
      debug_fragment: "debug/fragment"
    }, "shaders/", this.init.bind(this) );
  };
  
  this.setUpGui = function() {
    var gui = new dat.GUI();
    this.scroller.addGuiFolder(gui);
    this.waveSim.addGuiFolder(gui);
  }

  this.canScroll = function(sceneDelta) {
    return (sceneDelta > 0 && this.sceneIndex < this.scenes.length - 1) || (sceneDelta < 0 && this.sceneIndex > 0);
  }

  this.setScene = function(sceneDelta) {
    this.sceneIndex += sceneDelta;
    this.scroller.setFinalScrollValue(this.scenes[this.sceneIndex].final_scroll_value);
    this.setScrollOrigin(sceneDelta);
    this.enableScrolling();
  }

  this.setScrollOrigin = function(sceneDelta) {
    var scrollOriginY = 1 / this.boxGrid.rowCount;
    if (sceneDelta < 0)
      scrollOriginY = 1 - 1 / this.boxGrid.rowCount;
    var scrollOrigin = new THREE.Vector2(0.5, scrollOriginY);
    this.mesh.material.uniforms.scroll_origin.value = scrollOrigin;
    this.scroller.setSimUniform('scroll_origin', scrollOrigin);
  }

  this.enableScrolling = function() {
    this.isScrolling = true;
  }

  this.disableScrolling = function() {
    this.scroller.setSimUniform('scroll_position', 0)
    this.isScrolling = false;
  };

  this.addEventListeners = function() {
    window.addEventListener( 'resize', this.onWindowResize.bind(this));  
    window.addEventListener('mousemove', this.onMouseMove.bind(this));  
    window.addEventListener('mousewheel', this.onMouseScroll.bind(this));
  };

  this.addDebugPlane = function(scene) {
    var plane = new THREE.PlaneGeometry( this.width/4, this.height/4, 1, 1);
    var planeMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        texture: { type: "t", value: this.scroller.getCurrentPositionTexture() }
      },
      vertexShader: ShaderLoader.get('debug_vertex'),
      fragmentShader: ShaderLoader.get('debug_fragment'),
      transparent: true
    });
    planeMesh = new THREE.Mesh( plane, planeMaterial );
    planeMesh.position.z = 2 * this.boxGrid.boxLengthInPixels;
    planeMesh.position.x = this.width/3;
    planeMesh.position.y = this.height/3;
    scene.add( planeMesh );
  }

  this.onMouseMove = function(event) {
    var mouse = new THREE.Vector2(event.offsetX / this.width, 1 - (event.offsetY / this.height));
    this.waveSim.changeMousePosition(mouse);
  };

  this.onMouseScroll = function(event) {
    if (!this.isScrolling) {
      var sceneDelta = Math.sign(event.deltaY);
      if (this.canScroll(sceneDelta)) this.setScene(sceneDelta);
    }
  };

  this.onWindowResize = function( event ) {
    // camera.left  = -.5 * window.innerWidth;
    // camera.right = .5 * window.innerWidth;
    // camera.top = .5 * window.innerHeight;
    // camera.bottom = -.5 * window.innerHeight;
    // camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  this.animate = function() {
    requestAnimationFrame( this.animate.bind(this) );

    this.waveSim.ticktock();
    this.waveSim.setSimUniform('using_mouse', 0)
    this.scroller.update();
    this.renderer.render( this.scene, this.camera );
    
    if (this.isScrolling) {
      this.scroller.increaseScrollPosition();
    }
    if (this.scroller.getSimUniform('scroll_position') > 1.5) this.disableScrolling();
    this.stats.update();
  };
  
  this.getTexture = function(textureName) {
    var texture = new THREE.TextureLoader().load( 'textures/'+ textureName );
    texture.magFilter = THREE.NearestFilter;
  	texture.minFilter = THREE.NearestFilter;
    
    return texture;
  };
    
  this.initScrollingMaterial = function() {
    var texture = this.getTexture('scrollingMap.png');
    
    this.scrollingUniforms = {
      rotationField: { type: "t", value: this.scroller.getCurrentPositionTexture() },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: this.width },
      height: { type: "f", value: this.height },
      scroll_origin: { type: 'v2', value: new THREE.Vector2(0.5, 0.) }
    };
    
    return new THREE.RawShaderMaterial({
      uniforms: this.scrollingUniforms,
      vertexShader: ShaderLoader.get('scrolling_cube_vertex'),
      fragmentShader: ShaderLoader.get('scrolling_cube_fragment')
    });
  };
  
  this.initWaveMaterial = function() {    
    var texture = this.getTexture('waveMap.png');
    
    this.waveUniforms = {
      rotationField: { type: "t", value: this.waveSim.getCurrentPositionTexture() },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: this.width },
      height: { type: "f", value: this.height },
      scroll_origin: { type: 'v2', value: new THREE.Vector2(0.5, 0.) }
    };
    
    return new THREE.RawShaderMaterial({
      uniforms: this.waveUniforms,
      vertexShader: ShaderLoader.get('cube_vertex'),
      fragmentShader: ShaderLoader.get('cube_fragment')
    });
  }
  
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
    
    var scrollingShaderHash = {
      scrolling: {
        vertex:   ShaderLoader.get('scrolling_vertex'),
        fragment: ShaderLoader.get('scrolling_fragment')
      },
      passThrough: {
        vertex: ShaderLoader.get('passthrough_vertex'),
        fragment: ShaderLoader.get('passthrough_fragment')
      }
    };
    
    this.container = document.getElementById( 'container' );
    
    this.boxGrid = new InstancedBoxGridGeometry(this.width, this.height);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setClearColor( 0xffffff );
    // renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( this.width, this.height );

    this.waveSim = new Simulation(this.renderer, 2 * this.boxGrid.columnCount, 2 * this.boxGrid.rowCount, waveSimShaderHash);
    this.waveSim.initSceneAndMeshes();
    
    this.scroller = new Scroller(this.renderer, this.boxGrid.columnCount, this.boxGrid.rowCount, scrollingShaderHash);
    this.scroller.initSceneAndMeshes();
    
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
    this.scrollingMaterial = this.initScrollingMaterial();

    this.mesh = new THREE.Mesh( geometry, this.waveMaterial );
    this.scene.add( this.mesh );
    
    this.container.appendChild( this.renderer.domElement );
    
    this.stats = new Stats();
    this.container.appendChild( this.stats.dom );

    if (this.renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
      alert( "You are missing support for 'ANGLE_instanced_arrays'" );
      return;
    }
    this.addEventListeners();
    this.setUpGui();
    this.animate();
  };
}

window.onload = function() {
  var cubes = new Cubes();
  cubes.onLoad();
}