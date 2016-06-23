"use strict";

var container, stats;

var camera, scene, renderer, mesh, simulation, scroller, planeMesh, boxGrid;

var scrollDuration, isScrolling;

var scenes = [
  { final_scroll_value: 0.5 },
  { final_scroll_value: 1.0 },
  { final_scroll_value: 0.5 },
];

var sceneIndex = 0;

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
    scrolling_cube_vertex: "scrolling_cubes/vertex",
    scrolling_cube_fragment: "scrolling_cubes/fragment",
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
    scrolling: {
      vertex:   ShaderLoader.get('scrolling_vertex'),
      fragment: ShaderLoader.get('scrolling_fragment')
    },
    passThrough: {
      vertex: ShaderLoader.get('passthrough_vertex'),
      fragment: ShaderLoader.get('passthrough_fragment')
    }
  };
  
  container = document.getElementById( 'container' );
  
  boxGrid = new InstancedBoxGridGeometry(width, height);
  
  renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setClearColor( 0xffffff );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( width, height );
  // renderer.setFaceCulling(false, "cw")

  // simulation = new Simulation(2 * boxGrid.columnCount, 2 * boxGrid.rowCount, simulationShaderHash);
  simulation = new Simulation(renderer, 2 * boxGrid.columnCount, 2 * boxGrid.rowCount, simulationShaderHash);
  simulation.initSceneAndMeshes();
  
  scroller = new Scroller(renderer, boxGrid.columnCount, boxGrid.rowCount, scrollingShaderHash);
  scroller.initSceneAndMeshes();
  
  camera = new THREE.OrthographicCamera( 
    0.99 * -.5 * width,
    0.99 *  .5 * width,
    0.99 *  .5 * height,
    0.99 * -.5 * height,
    1,
    boxGrid.boxLengthInPixels * (boxGrid.columnCount + boxGrid.rowCount + 2) );
  
  // camera = new THREE.PerspectiveCamera(60, width/height, 1, boxGrid.boxLengthInPixels * (boxGrid.columnCount + boxGrid.rowCount + 2))
  camera.position.z = boxGrid.boxLengthInPixels * boxGrid.rowCount;
  
  scene = new THREE.Scene();

  var geometry = boxGrid.geometry;

  // material
  var texture = new THREE.TextureLoader().load( 'textures/cubeMap3.png' );
  texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
  texture.anisotropy = 1;
	texture.generateMipmaps = false;
  
  var material = new THREE.RawShaderMaterial( {
    uniforms: {
      rotationField: { type: "t", value: scroller.getCurrentPositionTexture() },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: width },
      height: { type: "f", value: height },
      scroll_origin: { type: 'v2', value: new THREE.Vector2(0.5, 0.) }
    },
    vertexShader: ShaderLoader.get('scrolling_cube_vertex'),
    fragmentShader: ShaderLoader.get('scrolling_cube_fragment')
  } );
  
  material.side = THREE.FrontSide;

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
  
  
  //For debugging
  var plane = new THREE.PlaneGeometry(width/4,height/4,1,1);
  var planeMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      texture: { type: "t", value: scroller.getCurrentPositionTexture() }
    },
    vertexShader: ShaderLoader.get('debug_vertex'),
    fragmentShader: ShaderLoader.get('debug_fragment'),
    transparent: true
  });
  planeMesh = new THREE.Mesh( plane, planeMaterial );
  planeMesh.position.z = 2 * boxGrid.boxLengthInPixels;
  planeMesh.position.x = width/3;
  planeMesh.position.y = height/3;
  scene.add( planeMesh );
  
  container.appendChild( renderer.domElement );
  
  stats = new Stats();
  container.appendChild( stats.dom );
  // 
  // window.addEventListener( 'resize', onWindowResize, false );
  
  renderer.domElement.addEventListener('click', onMouseClick);
  
  window.addEventListener('mousewheel', onMouseScroll);
  
  if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
    alert( "You are missing support for 'ANGLE_instanced_arrays'" );
    return;
  }
  
  scrollDuration = 2.0;
  // enableScrolling();
  
  animate();
  
  function onMouseClick(event) {
    var mouse = new THREE.Vector2(event.offsetX / width, 1 - (event.offsetY / height));
    mesh.material.uniforms.scroll_origin.value = mouse;
    scroller.setSimUniform('scroll_origin', mouse);
  };
  
  function onMouseScroll(event) {
    if (!isScrolling) {
      var scrollDelta = Math.sign(event.deltaY);
      if (canScroll(scrollDelta)) scroll(scrollDelta);
      console.log(sceneIndex);  
    }
  };
  
  function setScrollPosition(scrollPosition) {
    scroller.setSimUniform('scroll_position', scrollPosition);
  }
}

function canScroll(scrollDelta) {
  return (scrollDelta > 0 && sceneIndex < scenes.length - 1) || (scrollDelta < 0 && sceneIndex > 0);
}

function scroll(scrollDelta) {
  sceneIndex += scrollDelta;
  scroller.setFinalScrollValue(scenes[sceneIndex].final_scroll_value);
  setScrollOrigin(scrollDelta);
  enableScrolling();
}

function setScrollOrigin(scrollDelta) {
  var scrollOriginY = 1 / boxGrid.rowCount;
  if (scrollDelta < 0)
    scrollOriginY = 1 - 1 / boxGrid.rowCount;
  var scrollOrigin = new THREE.Vector2(0.5, scrollOriginY);
  mesh.material.uniforms.scroll_origin.value = scrollOrigin;
  scroller.setSimUniform('scroll_origin', scrollOrigin);
}

function enableScrolling() {
  isScrolling = true;
}

function disableScrolling() {
  scroller.setSimUniform('scroll_position', 0)
  isScrolling = false;
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
  
  if (isScrolling) {
    var scrollPosition = scroller.getSimUniform('scroll_position') + 1 / scrollDuration / 60;
    scroller.setSimUniform('scroll_position', scrollPosition);
  }
  if (scroller.getSimUniform('scroll_position') > 1.5) disableScrolling();
  stats.update();
}
