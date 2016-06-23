"use strict";

function Scroller(renderer, width, height, shaderHash) {
  GenericSimulation.call(this, renderer, width, height, shaderHash);
  
  this.getSimulationMaterial = function() {
    return new THREE.RawShaderMaterial({
      uniforms: {
        position_texture: { type: 't', value: this.getCurrentPositionTexture() },
        dx: { type: 'f', value: 1/this.width },
        dy: { type: 'f', value: 1/this.height },
        width: { type: 'f', value: this.width },
        height: { type: 'f', value: this.height },
        wave_speed: { type: 'f', value: 0.6 / Math.max(this.width, this.height) },
        damping_strength: { type: 'f', value: 0.02 },
        rotation_rate: {type: 'f', value: 0.02 },
        scroll_position: { type: 'f', value: 0.0 },
        scroll_origin: { type: 'v2', value: new THREE.Vector2(0.5, 0.) },
        final_scroll_value: { type: 'f', value: 0.5 }
      },
      vertexShader: this.shaderHash.scrolling.vertex,
      fragmentShader: this.shaderHash.scrolling.fragment
    });
  };
    
  this.setFinalScrollValue = function(scrollValue) {
    this.setSimUniform('final_scroll_value', scrollValue)
  }
};

Scroller.prototype = Object.create(GenericSimulation.prototype);
Scroller.prototype.constructor = Simulation;
