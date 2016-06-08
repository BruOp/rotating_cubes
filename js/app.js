"use strict";

var container, stats;

var camera, scene, renderer, mesh, simulation;

window.onload = function() {
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
  }, "shaders/", init );
}

function init() {
  var height = window.innerHeight;
  var width  = window.innerWidth;
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
  
  container = document.getElementById( 'container' );
  
  var boxGrid = new InstancedBoxGridGeometry(width, height);
  
  simulation = new Simulation(2 * boxGrid.columnCount, 2 * boxGrid.rowCount, simulationShaderHash);
  simulation.init();
  
  camera = new THREE.OrthographicCamera( 
    -.5 * width,
    .5 * width,
    .5 * height,
    -.5 * height,
    1,
    boxGrid.boxLengthInPixels * (boxGrid.columnCount + boxGrid.rowCount + 2) );
  
  camera.position.z = boxGrid.boxLengthInPixels * 2;

  renderer = new THREE.WebGLRenderer();
  scene = new THREE.Scene();

  var geometry = boxGrid.geometry;

  // material
  var rotationField = new THREE.TextureLoader().load( 'textures/rotationField.png' );
  var texture = new THREE.TextureLoader().load( 'textures/cubeMap.png' );
  texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.NearestFilter;
  
  var material = new THREE.RawShaderMaterial( {
    uniforms: {
      rotationField: { type: "t", value: simulation.getPositionTexture() },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: width },
      height: { type: "f", value: height }
    },
    vertexShader: ShaderLoader.get('cube_vertex'),
    fragmentShader: ShaderLoader.get('cube_fragment'),
    transparent: false
  } );

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );
  
  
  //For debugging
  var plane = new THREE.PlaneGeometry(width/4,height/4,1,1);
  var planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      texture: { type: "t", value: simulation.getPositionTexture() }
    },
    vertexShader: ShaderLoader.get('debug_vertex'),
    fragmentShader: ShaderLoader.get('debug_fragment'),
  });
  var planeMesh = new THREE.Mesh( plane, planeMaterial );
  planeMesh.position.z = 20;
  planeMesh.position.x = width/3;
  planeMesh.position.y = height/3;
  scene.add( planeMesh );
  

  renderer.setClearColor( 0x101010 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  stats = new Stats();
  container.appendChild( stats.dom );

  window.addEventListener( 'resize', onWindowResize, false );
  renderer.domElement.addEventListener('click', onMouseClick);
  
  // container.appendChild(simulation.renderer.domElement);
  // simulation.renderer.domElement.addEventListener('click', simulation.onMouseClick.bind(simulation));
  
  if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
    alert( "You are missing support for 'ANGLE_instanced_arrays'" );
    return;
  }
  
  animate();
  
  function onMouseClick(event) {
    var mouse = new THREE.Vector2(event.offsetX / width, 1 - (event.offsetY / height));
    // raycaster.setFromCamera(mouse, orthoCamera);
    // 
    // var intersects = raycaster.intersectObjects(scene.children);
    // if (intersects.length > 0) {
    //   intersect.copy(intersects[0].uv);
    // }
    console.log(mouse)
    simulation.setSimUniform('mouse', mouse);
    simulation.setSimUniform('mouse_magnitude', 1);
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

  renderer.render( scene, camera );
  simulation.update();
  stats.update();
}
