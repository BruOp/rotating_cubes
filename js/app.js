"use strict";

var container, stats;

var camera, scene, renderer, mesh, simulation, scroller, planeMesh;

window.onload = function() {
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
    debug_vertex: "debug/vertex",
    debug_fragment: "debug/fragment"
  }, "shaders/", init );
}

function init() {
  var width  = window.innerWidth;
  var height = window.innerHeight;
  var simulationShaderHash = {
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
    vertex:   ShaderLoader.get('scrolling_vertex'),
    fragment: ShaderLoader.get('scrolling_fragment')
  };
  
  container = document.getElementById( 'container' );
  
  var boxGrid = new InstancedBoxGridGeometry(width, height);
  
  
  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0x404040 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( width, height );

  // simulation = new Simulation(2 * boxGrid.columnCount, 2 * boxGrid.rowCount, simulationShaderHash);
  simulation = new Simulation(renderer, 2 * boxGrid.columnCount, 2 * boxGrid.rowCount, simulationShaderHash);
  simulation.initSceneAndMeshes();
  
  scroller = new Scroller(renderer, 4 * boxGrid.columnCount, 4 * boxGrid.rowCount, scrollingShaderHash);
  scroller.initSceneAndMesh();
  
  camera = new THREE.OrthographicCamera( 
    -.5 * width,
    .5 * width,
    .5 * height,
    -.5 * height,
    1,
    boxGrid.boxLengthInPixels * (boxGrid.columnCount + boxGrid.rowCount + 2) );
  
  camera.position.z = boxGrid.boxLengthInPixels * 2;
  
  scene = new THREE.Scene();

  var geometry = boxGrid.geometry;

  // material
  var texture = new THREE.TextureLoader().load( 'textures/cubeMap2.png' );
  texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
  
  var material = new THREE.RawShaderMaterial( {
    uniforms: {
      rotationField: { type: "t", value: simulation.getCurrentPositionTexture() },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: width },
      height: { type: "f", value: height }
    },
    vertexShader: ShaderLoader.get('cube_vertex'),
    fragmentShader: ShaderLoader.get('cube_fragment')
  } );

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
  
  
  //For debugging
  var plane = new THREE.PlaneGeometry(width/4,height/4,1,1);
  var planeMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      texture: { type: "t", value: simulation.getCurrentPositionTexture() }
    },
    vertexShader: ShaderLoader.get('debug_vertex'),
    fragmentShader: ShaderLoader.get('debug_fragment'),
    transparent: true
  });
  planeMesh = new THREE.Mesh( plane, planeMaterial );
  planeMesh.position.z = 40;
  planeMesh.position.x = width/3;
  planeMesh.position.y = height/3;
  scene.add( planeMesh );
  
  container.appendChild( renderer.domElement );
  
  stats = new Stats();
  container.appendChild( stats.dom );
  // 
  // window.addEventListener( 'resize', onWindowResize, false );
  
  renderer.domElement.addEventListener('mousemove', onMouseClick);
  // simulation.renderer.domElement.addEventListener('click', onMouseClick);
  
  window.addEventListener('scroll', onMouseScroll);
  
  if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
    alert( "You are missing support for 'ANGLE_instanced_arrays'" );
    return;
  }
  
  animate();
  
  function onMouseClick(event) {
    var mouse = new THREE.Vector2(event.offsetX / width, 1 - (event.offsetY / height));
    simulation.changeMousePosition(mouse);
  };
  
  function onMouseScroll(event) {
    var scrollPosition = document.body.scrollTop / document.body.scrollHeight;
    scroller.setScrollPosition(scrollPosition);
  };
}

function onWindowResize( event ) {
  
  camera.left  = -.5 * window.innerWidth;
  camera.right = .5 * window.innerWidth;
  camera.top = .5 * window.innerHeight;
  camera.bottom = -.5 * window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

  requestAnimationFrame( animate );

  simulation.ticktock();
  simulation.setSimUniform('mouse_magnitude', 0)
  scroller.update();
  renderer.render( scene, camera );
  // simulation.passThroughRender(simulation.getCurrentPositionTexture())
  stats.update();
}
