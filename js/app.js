var container, stats;

var camera, scene, renderer, mesh;

function init() {
  var height = window.innerHeight;
  var width  = window.innerWidth;
  
  container = document.getElementById( 'container' );
  
  var boxGrid = new BoxGrid(width, height);
  
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
      rotationField: { type: "t", value: rotationField },
      map: { type: "t", value: texture },
      time: { type: "f", value: 0.0 },
      width: { type: "f", value: width },
      height: { type: "f", value: height }
    },
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
    transparent: false
  } );

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  renderer.setClearColor( 0x101010 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  stats = new Stats();
  container.appendChild( stats.dom );

  window.addEventListener( 'resize', onWindowResize, false );
  
  if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
    alert( "You are missing support for 'ANGLE_instanced_arrays'" );
    return;
  }
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

  render();
  stats.update();

}

function render() {

  var object = scene.children[0];
  mesh.material.uniforms.time.value += 0.005;
  renderer.render( scene, camera );
}

init();
animate();
