"use strict";

function Simulation(width, height, shaderHash) {
    //Setting constants
    this.width = width;
    this.height = height;
    this.shaderHash = shaderHash;

    this.setSimUniform = function(uniformName, newValue) {
      return SimulationUtilities.setUniform(this.simulationMesh, uniformName, newValue)
    };

    this.passThroughRender = function(input, output) {
      SimulationUtilities.setUniform(this.passThroughMesh, 'texture', input);
      if (!output) {
        this.renderer.render(this.passThroughScene, this.orthoCamera);
      } else {
        this.renderer.render(this.passThroughScene, this.orthoCamera, output);
      }
    };

    this.update = function() {
      //render the particles at the new location
      this.renderer.render( this.simulationScene, this.orthoCamera, this.rtPositionNew);
      this.setSimUniform("position_texture", this.rtPositionNew.texture);
      this.renderer.render( this.simulationScene, this.orthoCamera, this.rtPositionCur);
      this.setSimUniform("position_texture", this.rtPositionCur.texture);
      
      this.setSimUniform('mouse_magnitude', 0.0);
    }
    
    this.getPositionTexture = function() {
      return this.rtPositionCur.texture
    }
    
    this.init = function() {
      this.raycaster = new THREE.Raycaster();
      this.intersect = new THREE.Vector2(0.5, 0.5);
      this.mouse = new THREE.Vector2();
      
      this.renderer = new THREE.WebGLRenderer();
      this.renderer.setSize(this.width, this.height);
      
      var gl = this.renderer.getContext();

      //1 we need FLOAT Textures to store positions
      if (!gl.getExtension("OES_texture_float")) {
          throw new Error( "float textures not supported" );
      }
      
      this.simulationScene  = new THREE.Scene();
      this.passThroughScene = new THREE.Scene();
      this.orthoCamera = new THREE.OrthographicCamera(-1,1,1,-1,1/Math.pow( 2, 53 ),1 );

      var passThroughMaterial = new THREE.ShaderMaterial({
        uniforms: {
      		texture: { type: "t", value: null }
        },
        vertexShader: this.shaderHash.passThrough.vertex,
        fragmentShader: this.shaderHash.passThrough.fragment,
      });

      //5 the simulation:
      //create a bi-unit quadrilateral and uses the simulation material to update the Float Texture
      var geom = SimulationUtilities.getBiUnitPlane();
      this.passThroughMesh = new THREE.Mesh(geom, passThroughMaterial);
      this.passThroughScene.add(this.passThroughMesh);

      [this.rtPositionCur, this.rtPositionNew] = SimulationUtilities.getRenderTargets(this, this.width, this.height);
      
      var simulationMaterial = new THREE.ShaderMaterial({
        uniforms: {
          position_texture: { type: 't', value: this.rtPositionCur.texture },
          mouse: { type: "v2", value: this.intersect },
          dx: { type: 'f', value: 1/this.width },
          dy: { type: 'f', value: 1/this.height },
          width: { type: 'f', value: this.width },
          height: { type: 'f', value: this.height },
          wave_speed: { type: 'f', value: 0.7 / Math.min(this.width, this.height) },
          damping_strength: { type: 'f', value: 0.005 },
          mouse_magnitude: { type: "f", value: 0.0 },
          draw_radius: { type: "f", value: 10 / this.width }
        },
        vertexShader: this.shaderHash.simulation.vertex,
        fragmentShader: this.shaderHash.simulation.fragment
      });
      
      geom = SimulationUtilities.getBiUnitPlane();
      this.simulationMesh = new THREE.Mesh(geom, simulationMaterial);
      this.simulationScene.add(this.simulationMesh);
    }
};