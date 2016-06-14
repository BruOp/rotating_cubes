function Scroller(renderer, width, height, shaderHash) {
  this.renderer = renderer;
  this.width = width;
  this.height = height;
  this.shaderHash = shaderHash;
  
  this.setUniform = function(uniformName, newValue) {
    return this.mesh.material.uniforms[uniformName].value = newValue;
  },
  
  this.getUniform = function(uniformName) {
    return this.mesh.material.uniforms[uniformName].value;
  },

  this.getBiUnitPlane = function() {
    return new THREE.PlaneBufferGeometry( 2, 2, 1, 1 );
  };

  this.getRenderTarget = function(options) {
    var userOptions = options || {};
    var defaultOptions = this.defaultRenderTargetOptions();
    for (var attrName in userOptions) {
      defaultOptioons[attrName] = userOptions[attrName];
    }
    var renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, defaultOptions);
    return renderTarget;
  };

  this.defaultRenderTargetOptions = function() {
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
  };

  this.getMaterial = function() {
    var texture = new THREE.TextureLoader().load( 'textures/scrollingValues3.png' );
    // texture.magFilter = THREE.NearestFilter;
  	// texture.minFilter = THREE.NearestFilter;
    // texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // texture.flipY = true;
    
    return new THREE.RawShaderMaterial({
      uniforms: {
        texture: { type: 't', value: texture },
        num_of_scenes: { type: 'f', value: 3 },
        time: { type: 'f', value: 0.0 },
        current_top: { type: 'f', value: 0.0 },
        dimensions: { type: 'v2', value: new THREE.Vector2(width, height) }
      },
      vertexShader: this.shaderHash.vertex,
      fragmentShader: this.shaderHash.fragment
    });
  };

  this.setScrollPosition = function(scrollPosition) {
    this.setUniform('current_top', scrollPosition);
  };
  
  this.getCurrentPositionTexture = function() {
    // this.renderTarget.texture.flipY = false;
    return this.renderTarget.texture;
  };

  this.update = function() {
    this.setUniform('time', this.getUniform('time') + 0.001)
    this.renderer.render(this.scene, this.orthoCamera, this.renderTarget);
  };

  this.initSceneAndMesh = function() {
    
    this.scene = new THREE.Scene();
    this.orthoCamera = new THREE.OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1 );
    this.renderTarget = this.getRenderTarget();

    var geom = this.getBiUnitPlane();
    var material = this.getMaterial();
    this.mesh = new THREE.Mesh(geom, material);
    this.scene.add(this.mesh)
  }
};
