"use strict";

var GenericSimulation = function(renderer, width, height, shaderHash) {
  this.renderer = renderer;
  this.width = width;
  this.height = height;
  this.shaderHash = shaderHash;
}

GenericSimulation.prototype = {
  
  setUniform: function(mesh, uniformName, newValue) {
    return mesh.material.uniforms[uniformName].value = newValue;
  },
  
  setSimUniform: function(uniformName, newValue) {
    return this.setUniform(this.simulationMesh, uniformName, newValue);
  },
  
  getUniform: function(mesh, uniformName) {
    return mesh.material.uniforms[uniformName].value;
  },
  
  getSimUniform: function(uniformName) {
    return this.simulationMesh.material.uniforms[uniformName].value;
  },

  passThroughRender: function(input, output) {
    this.setUniform(this.passThroughMesh, 'texture', input);
    if (!output) {
      this.renderer.render(this.passThroughScene, this.orthoCamera);
    } else {
      this.renderer.render(this.passThroughScene, this.orthoCamera, output);
    }
  },
  
  renderSimulation: function(output) {
    this.renderer.render(this.simulationScene, this.orthoCamera, output);
  },

  ticktock: function() {
    // Note that this ping pongs between the two textures and actually performs
    // two simulation passes per update. Not sure that it'll have much worse
    // performance than the vanilla update function
    this.renderSimulation(this.rtPositionNew);
    this.setSimUniform("position_texture", this.rtPositionNew.texture);
    this.renderSimulation(this.rtPositionCur);
    this.setSimUniform("position_texture", this.rtPositionCur.texture);
  },
  
  update: function() {
    // This performs only one render pass, but must render twice still.
    this.renderSimulation(this.rtPositionNew);
    this.passThroughRender(this.rtPositionNew, this.rtPositionCur)
  },
  
  getCurrentPositionTexture: function() {
    return this.rtPositionCur.texture;
  },

  getBiUnitPlane: function() {
    return new THREE.PlaneBufferGeometry( 2, 2, 1, 1 );
  },

  generatePositionTexture: function() {
    var arr = new Float32Array(this.width * this.height * 4);
    for (var i = 0; i < arr.length - 1; i += 4) {
      arr[i] = 0.5;
      arr[i+1] = 0.5;
      arr[i+2] = 0.5;
      arr[i+3] = 1.0;
    }
    var texture = new THREE.DataTexture(arr, this.width, this.height, THREE.RGBAFormat, THREE.FloatType, THREE.UVMapping);
    texture.needsUpdate = true;
    return texture;
  },
  
  getRenderTargets: function() {
    var dtPosition = this.generatePositionTexture();
    return [1,2].map(function() {
      var rtt = this.getRenderTarget();
      this.passThroughRender(dtPosition, rtt);
      return rtt;
    }.bind(this))
  },
  
  getRenderTarget: function(options) {
    var userOptions = options || {};
    var defaultOptions = this.defaultRenderTargetOptions();
    for (var attrName in userOptions) {
      defaultOptioons[attrName] = userOptions[attrName];
    }
    var renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, defaultOptions);
    return renderTarget;
  },
  
  defaultRenderTargetOptions: function() {
    return {
      wrapS: THREE.ClampToEdge,
      wrapT: THREE.ClampToEdge,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
      depthBuffer: false
    };
  },
  
  checkForExtensions: function() {
    var gl = this.renderer.getContext();
    //1 we need FLOAT Textures to store positions
    if (!gl.getExtension("OES_texture_float")) {
      throw new Error( "float textures not supported" );
    }
  },
  
  createPassThroughMesh: function() {
    var geom = this.getBiUnitPlane();
    var material = new THREE.RawShaderMaterial({
      uniforms: {
        texture: { type: "t", value: null }
      },
      vertexShader: this.shaderHash.passThrough.vertex,
      fragmentShader: this.shaderHash.passThrough.fragment,
    });
    return new THREE.Mesh(geom, material);
  },
  
  createSimulationMesh: function() {
    var simulationMaterial = this.getSimulationMaterial();
    var geom = this.getBiUnitPlane();
    return new THREE.Mesh(geom, simulationMaterial);
  },
  
  initSceneAndMeshes: function(simulationMaterial) {
    this.checkForExtensions();

    this.simulationScene  = new THREE.Scene();
    this.passThroughScene = new THREE.Scene();
    this.orthoCamera = new THREE.OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1 );

    //5 the simulation:
    //create a bi-unit quadrilateral and uses the simulation material to update the Float texture
    this.passThroughMesh = this.createPassThroughMesh();
    this.passThroughScene.add(this.passThroughMesh);

    [this.rtPositionCur, this.rtPositionNew] = this.getRenderTargets(this, this.width, this.height);

    this.simulationMesh = this.createSimulationMesh()
    this.simulationScene.add(this.simulationMesh);
  }
}