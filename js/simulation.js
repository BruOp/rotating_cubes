"use strict";

function Simulation(renderer, width, height, shaderHash) {
  GenericSimulation.call(this, renderer, width, height, shaderHash);
  
  this.getSimulationMaterial = function() {
    return new THREE.RawShaderMaterial({
      uniforms: this.simUniforms,
      vertexShader: this.shaderHash.simulation.vertex,
      fragmentShader: this.shaderHash.simulation.fragment
    });
  };
  
  this.setupUniforms = function() {
    this.simUniforms = {
      position_texture: { type: 't', value: this.getCurrentPositionTexture() },
      mouse: { type: "v2", value: new THREE.Vector2(0,0) },
      dx: { type: 'f', value: 1/this.width },
      dy: { type: 'f', value: 1/this.height },
      width: { type: 'f', value: this.width },
      height: { type: 'f', value: this.height },
      wave_speed: { type: 'f', value: 0.2 / Math.max(this.width, this.height) },
      damping_strength: { type: 'f', value: 0.02 },
      mouse_magnitude: { type: "f", value: 0.0 },
      draw_radius: { type: "f", value: 2 / this.width }
    };
  };
  
  this.changeMousePosition = function(mouse) {
    simulation.setSimUniform('mouse', mouse);
    simulation.setSimUniform('mouse_magnitude', 1);
  };
  
  this.addGuiFolder = function(gui) {
    var folder = gui.addFolder('Wave Simulation');
    folder.add(this.simUniforms.wave_speed, 'value', 0.05 / Math.max(this.width, this.height), 0.8 / Math.max(this.width, this.height));
    folder.add(this.simUniforms.damping_strength, 'value', 0.0, 0.1);
    folder.add(this.simUniforms.draw_radius, 'value', 1 / this.width, 6 / this.width);
  };
};

Simulation.prototype = Object.create(GenericSimulation.prototype);
Simulation.prototype.constructor = Simulation;
