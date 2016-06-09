"use strict";
// Rename Utils
var SimulationUtilities = function() {
  
  function setUniform(mesh, uniformName, newValue) {
    return mesh.material.uniforms[uniformName].value = newValue;
  }
  
  function getBiUnitPlane() {
    return new THREE.PlaneBufferGeometry( 2, 2, 1, 1 );
  }

  function generatePositionTexture(width, height) {
    var arr = new Float32Array(width * height * 4);
    for (var i = 0; i < arr.length - 1; i += 4) {
      arr[i] = 0.5;
      arr[i+1] = 0.5;
      arr[i+2] = 0.5;
      arr[i+3] = 1.0;
    }
    // var center = Math.floor(0.5 * height * width * 3) + Math.floor(0.5 * width * 3);
    // arr[center] = 0.50001;
    
    var texture = new THREE.DataTexture(arr, width, height, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping);
    texture.needsUpdate = true;
    return texture;
  }

  function getRenderTarget(width, height) {
    var renderTarget = new THREE.WebGLRenderTarget(width, height, {
      wrapS: THREE.ClampToEdge,
      wrapT: THREE.ClampToEdge,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
      depthBuffer: false
    });
    return renderTarget;
  }

  function getRenderTargets(renderer, width, height) {
    var dtPosition = generatePositionTexture(width, height);
    return [1,2].map(function() {
      var rtt = getRenderTarget(width, height);
      renderer.passThroughRender(dtPosition, rtt);
      return rtt;
    })
  }
  
  return {
    setUniform: setUniform,
    getBiUnitPlane: getBiUnitPlane,
    generatePositionTexture: generatePositionTexture,
    getRenderTarget: getRenderTarget,
    getRenderTargets: getRenderTargets
  }
}();
