#define M_PI 3.1415926535897932384626433832795
#define MAX_HYPOTENUESE 0.70710678118
#define MIN_ANGLE 0.22
#define MIN_SPEED 0.001

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

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

vec2 when_gt(vec2 x, vec2 y) {
  return max(sign(x - y), 0.0);
}

vec2 getScreenUV(vec3 offset) {
  return vec2(
    (offset.x + .5 * width) / width,
    (offset.y + .5 * height) / height
  );
}

float is_angle_and_speed_great_enough(vec2 angles, vec2 screenUV) {
  float speed = distance(texture2D(rotationField, screenUV).rg, texture2D(rotationField, screenUV).ba);
  return clamp(when_gt(length(angles), MIN_ANGLE)
         + when_gt(speed, MIN_SPEED), 0., 1.);
}

vec2 convertToRadians(vec2 rotations) {
  // We expect 'rotation' to be normalized from 0 to 1.
  return 2. * M_PI * (rotations - vec2(.5, .5));
}

mat4 constructTransformationMatrix(vec2 angles, vec3 offset, vec2 screenUV) {
  vec2 adjusted_angles = is_angle_and_speed_great_enough(angles, screenUV) * angles;
  // vec2 adjusted_angles = when_gt(length(angles), MIN_ANGLE) * angles;
  float theta = adjusted_angles.x;
  float phi = adjusted_angles.y;
  mat4 rotationMatrix;
  //The index here refers to the COLUMNS of the matrix
  rotationMatrix[0] = vec4(
    cos(phi),
    0,
    -sin(phi),
    0
  );
  rotationMatrix[1] = vec4(
    sin(theta) * sin(phi),
    cos(theta),
    sin(theta) * cos(phi),
    0
  );
  rotationMatrix[2] = vec4(
    cos(theta) * sin(phi),
    -sin(theta),
    cos(theta) * cos(phi),
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
  mat4 rotationMatrix = constructTransformationMatrix(angles, offset, screenUV);
  
  gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix * vec4(position, 1.);
}
