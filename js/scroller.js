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
        wave_speed: { type: 'f', value: 0.2 / Math.max(this.width, this.height) },
        damping_strength: { type: 'f', value: 0.0 },
        scroll_position: { type: 'f', value: 0.2 },
        scroll_value: { type: 'f', value: 0.0 }
      },
      vertexShader: this.shaderHash.scrolling.vertex,
      fragmentShader: this.shaderHash.scrolling.fragment
    });
  };
  
  this.changeMousePosition = function(mouse) {
    simulation.setSimUniform('mouse', mouse);
    simulation.setSimUniform('mouse_magnitude', 1);
  };
};

Scroller.prototype = Object.create(GenericSimulation.prototype);
Scroller.prototype.constructor = Simulation;
