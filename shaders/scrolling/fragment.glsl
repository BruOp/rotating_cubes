#define MIN_VAL 0.01
#define PI_INVERSE 0.31830988618

precision highp float;

varying vec2 vUv;

uniform float wave_speed;
uniform float damping_strength;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform float scroll_position;
uniform float scroll_value;
uniform float rotation_rate;
uniform float final_scroll_value;
uniform vec2 scroll_origin;
uniform sampler2D position_texture;

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
}

float when_lt(float x, float y) {
  return max(sign(y - x), 0.0);
}

vec2 when_gt(vec2 x, vec2 y) {
  return max(sign(x - y), 0.0);
}

vec2 when_lt(vec2 x, vec2 y) {
  return max(sign(y - x), 0.0);
}

vec4 get_texture_values(vec2 tex_coords) {
  return texture2D(position_texture, tex_coords);
}

float get_current_values(vec2 uv) {
  return get_texture_values(uv).r;
}

float fd_central(float left, float center, float right, float dx) {
  return (right + left - (2.0 * center)) * pow(dx, -2.);
}

float get_derivs(float center, vec2 offset, float dx) {
  vec2 left_uv  = clamp(vUv - offset, 0., 1.);
  vec2 right_uv = clamp(vUv + offset, 0., 1.);
  float left   = get_current_values(left_uv);
  float right  = get_current_values(right_uv);
  return fd_central(left, center, right, dx);
}

float get_x_derivs(float center) {
  return get_derivs(center, vec2(dx, 0.), dx);
}

float get_y_derivs(float center) {
  return get_derivs(center, vec2(0., dy), dy);
}

float calculate_wave_equation(float cur_position, float old_position, float gradient) {
  vec2 wave_speeds = pow(wave_speed, 2.) * vec2(pow(height/width, 2.), 1.);
  float damping_factor = 1. / (1. + damping_strength);
  return damping_factor * (
      (damping_strength - 1.) * old_position
      + 2. * cur_position
      + dot(wave_speeds, vec2(gradient, gradient)));
}

float get_next_position(float cur_position, float old_position) {
  float x_derivs = get_x_derivs(cur_position);
  float y_derivs = get_y_derivs(cur_position);
  float gradient = x_derivs + y_derivs;
  
  return calculate_wave_equation(cur_position, old_position, gradient);
}

bool outsideScrollZone(vec2 uv) {
  return length(uv - scroll_origin) > scroll_position;
  // return uv.y > dy * width * (scroll_position - uv.x);  
}

void main() {
  float cur_position = get_texture_values(vUv).r;
  float old_position = get_texture_values(vUv).g;
  float new_position;
  
  if (outsideScrollZone(vUv)) {       //if it's outside our scroll zone
    // new_position = get_next_position(cur_position, old_position);
    new_position = cur_position;
  } else {                            // if it's inside our scroll zone
    float close_enough = when_lt(abs(cur_position - final_scroll_value), MIN_VAL);
    float next_value = (1. - close_enough) * (cur_position 
                        + sign(final_scroll_value - cur_position)
                        * rotation_rate);
    new_position = close_enough * final_scroll_value + next_value;
  }
  new_position = clamp(new_position, 0., 1.);  
  gl_FragColor = vec4(new_position, cur_position, 1.0, 1.);
}
