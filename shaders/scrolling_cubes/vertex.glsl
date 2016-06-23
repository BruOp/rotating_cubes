#define M_PI 3.1415926535897932384626433832795
#define MIN_VAL 0.01

precision highp float;

uniform float width;
uniform float height;
uniform float time;
uniform vec2 scroll_origin;
uniform sampler2D rotationField;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

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

vec2 get_screen_uv(vec3 offset) {
  return vec2(
    (offset.x + .5 * width) / width,
    (offset.y + .5 * height) / height
  );
}

float jitter_prevention_coefficent(float value) {
  float lower_half = step(MIN_VAL, value) * step(-(0.5 - MIN_VAL), -value);
  float upper_half = step((0.5 - MIN_VAL), value) * step(-(1. - MIN_VAL), -value);
  return lower_half + upper_half;
}

float convert_to_radians(float rotation_value) {
  // We expect 'rotation' to be normalized from 0 to 1.
  return 2. * M_PI * (rotation_value - .5);
}

float get_rotation_about_z(vec2 screen_uv) {
  vec2 direction_from_scroll_origin = normalize(screen_uv - scroll_origin);
  return asin(direction_from_scroll_origin.x);
}

float get_arbitrary_rotation(vec2 screen_uv) {
  float rotation_value = texture2D(rotationField, screen_uv).r;
  return convert_to_radians(rotation_value); //when_gt(abs(rotation_value - .5), 0.01) * 
}

mat4 construct_transformation_matrix(float arbitrary_rotation, vec3 offset, vec2 screen_uv) {
  float a = arbitrary_rotation;
  float g = get_rotation_about_z(screen_uv);
  // float g = .25 * M_PI;
  g = when_gt(abs(a), MIN_VAL) * g;
  
  mat4 rotationMatrix;
  //The index here refers to the COLUMNS of the matrix
  rotationMatrix[0] = vec4(
    pow(cos(g), 2.) + cos(a) * pow(sin(g), 2.),
    cos(a) * cos(g) * sin(g) - sin(g) * cos(g),
    sin(a) * sin(g),
    0
  );
  rotationMatrix[1] = vec4(
    cos(a) * cos(g) * sin(g) - sin(g) * cos(g),
    pow(sin(g), 2.) + cos(a) * pow(cos(g), 2.),
    sin(a) * cos(g),
    0
  );
  rotationMatrix[2] = vec4(
    -sin(a) * sin(g),
    -sin(a) * cos(g),
    cos(g),
    0
  );
  rotationMatrix[3] = vec4(offset, 1);

  return rotationMatrix;
}

void main() {
  vUv = uv;
  vNormal = normal;
  
  vec2 screenUV = get_screen_uv(offset);
  float rot_val = texture2D(rotationField, screenUV).r;
  // We sample our rotation field by the cubes position from origin;
  float arbitrary_rotation = get_arbitrary_rotation(screenUV);
  mat4 rotationMatrix = construct_transformation_matrix(arbitrary_rotation, offset, screenUV);
  gl_Position = projectionMatrix * modelViewMatrix * rotationMatrix * vec4(position, 1.);
}
