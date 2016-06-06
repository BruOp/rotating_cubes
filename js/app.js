var container, stats;

var camera, scene, renderer, mesh;
var orientations;


function init() {
  var height = window.innerHeight;
  var width  = window.innerWidth;
  var ROW_COUNT = 20;
  var boxLengthInPixels = height / ROW_COUNT;
  var COLUMN_COUNT = Math.ceil(width / boxLengthInPixels);

  container = document.getElementById( 'container' );
  
  camera = new THREE.OrthographicCamera( -.5 * width, .5 * width, .5 * height, -.5 * height, 1, boxLengthInPixels * (COLUMN_COUNT + ROW_COUNT + 1) );
  camera.position.z = boxLengthInPixels * 2;

  renderer = new THREE.WebGLRenderer();
  scene = new THREE.Scene();

  // geometry

  var instances = ROW_COUNT * COLUMN_COUNT;

  var boxGeometry = new THREE.BoxGeometry(
    boxLengthInPixels, boxLengthInPixels, boxLengthInPixels, //Side lengths
    1, 1, 1 //Number of tri's per face (N + 1)
  );
  var geometry = new THREE.InstancedBufferGeometry().fromGeometry(boxGeometry);

  // per instance data
  var offsets = new THREE.InstancedBufferAttribute( new Float32Array( instances * 3 ), 3, 1 );
  var dx = (boxLengthInPixels / width);
  var dy = 1 / ROW_COUNT;
  for ( var i = 0, ul = offsets.count; i < ul; i++ ) {
    var columnIndex = (i % COLUMN_COUNT)
    var rowIndex    = Math.floor(i / COLUMN_COUNT)
    var distanceFromCenterX = columnIndex - (.5 * COLUMN_COUNT);
    var distanceFromCenterY = rowIndex - (.5 * ROW_COUNT);
    
    var x = width  * (dx * (distanceFromCenterX + 0.5));
    var y = height * (dy * (distanceFromCenterY + 0.5));
    var z = (Math.abs(Math.ceil(distanceFromCenterX)) 
            + Math.abs(Math.ceil(distanceFromCenterY)))
            * -boxLengthInPixels;

    offsets.setXYZ( i, x, y, z );
  }

  geometry.addAttribute( 'offset', offsets ); // per mesh translation

  // material
  var rotationField = new THREE.TextureLoader().load( 'textures/rotationField.png' );
  var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
  texture.anisotropy = renderer.getMaxAnisotropy();

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
    side: THREE.DoubleSide,
    transparent: false

  } );

  mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );


  if ( renderer.extensions.get( 'ANGLE_instanced_arrays' ) === false ) {
    document.getElementById( "notSupported" ).style.display = "";
    return;
  }

  renderer.setClearColor( 0x101010 );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  stats = new Stats();
  container.appendChild( stats.dom );

  window.addEventListener( 'resize', onWindowResize, false );

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

var lastTime = 0;

var moveQ = ( new THREE.Quaternion( .5, .5, .5, 0.0 ) ).normalize();
var tmpQ = new THREE.Quaternion();
var currentQ = new THREE.Quaternion();
function render() {

  var object = scene.children[0];
  mesh.material.uniforms.time.value += 0.005
  renderer.render( scene, camera );
}

init();
animate();
