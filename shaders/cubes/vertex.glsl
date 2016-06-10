#define M_PI 3.1415926535897932384626433832795
#define MAX_HYPOTENUESE 0.70710678118
#define MIN_ANGLE 0.0
precision highp float;

uniform float width;
uniform float height;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform sampler2D rotationField;
uniform float time;

attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
attribute vec2 uv;

varying vec3 vNormal;
varying vec2 vUv;

float greater_than(float input_value, float min_value) {
  return max(sign(abs(input_value) - min_value), 0.);
}

vec2 greater_than(vec2 input_values, vec2 min_values) {
  return vec2(greater_than(input_values.x, min_values.x), greater_than(input_values.y, min_values.y));
}

vec2 getScreenUV(vec3 offset) {
  return vec2(
    (offset.x + .5 * width) / width,
    (offset.y + .5 * height) / height
  );
}

vec2 convertToRadians(vec2 rotations) {
  // We expect 'rotation' to be normalized from 0 to 1.
  return 2. * M_PI * (rotations - vec2(.5, .5));
}

mat4 constructTransformationMatrix(vec2 angles, vec3 offset) {
  // vec2 angles = rotation_angles;
  mat4 rotationMatrix;
  //The index here refers to the COLUMNS of the matrix
  rotationMatrix[0] = vec4(
    cos(angles.y),
    0,
    -sin(angles.y),
    0
  );
  rotationMatrix[1] = vec4(
    sin(angles.x) * sin(angles.y),
    cos(angles.x),
    sin(angles.x) * cos(angles.y),
    0
  );
  rotationMatrix[2] = vec4(
    cos(angles.x) * sin(angles.y),
    -sin(angles.x),
    cos(angles.x) * cos(angles.y),
    0
  );
  rotationMatrix[3] = vec4(offset, 1);
  
  return rotationMatrix;
}

void main() {
  vUv = uv;
  vNormal = normal;
  
  vec2 screenUV = getScreenUV(offset);
  // We sample our rotation field by the cubes position from origin;
  vec2 angles = convertToRadians(texture2D(rotationField, screenUV).rg);
  mat4 rotationMatrix = constructTransformationMatrix(angles, offset);
  
  gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix * vec4(position, 1.);
}
