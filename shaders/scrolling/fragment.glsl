#define MIN_DISTANCE_FROM_ORIGIN 0.01

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

uniform sampler2D position_texture;

float when_gt(float x, float y) {
  return max(sign(x - y), 0.0);
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

vec2 get_current_values(vec2 uv) {
  return get_texture_values(uv).rg;
}

vec2 fd_central(vec2 left, vec2 center, vec2 right, float dx) {
  return (right + left - (2.0 * center)) * pow(dx, -2.);
}

vec2 get_derivs(vec2 centers, vec2 offset, float dx) {
  vec2 left_uv  = clamp(vUv - offset, 0., 1.);
  vec2 right_uv = clamp(vUv + offset, 0., 1.);
  vec2 left   = get_current_values(left_uv);
  vec2 right  = get_current_values(right_uv);
  return fd_central(left, centers, right, dx);
}

vec2 get_x_derivs(vec2 centers) {
  return get_derivs(centers, vec2(dx, 0.), dx);
}

vec2 get_y_derivs(vec2 centers) {
  return get_derivs(centers, vec2(0., dy), dy);
}

float calculate_wave_equation(float cur_position, float old_position, vec2 gradient) {
  vec2 wave_speeds = pow(wave_speed, 2.) * vec2(pow(height/width, 2.), 1.);
  float damping_factor = 1. / (1. + damping_strength);
  return damping_factor * (
      (damping_strength - 1.) * old_position
      + 2. * cur_position
      + dot(wave_speeds, gradient));
}

vec2 get_next_positions(vec2 cur_positions, vec2 old_positions) {
  vec2 x_derivs = get_x_derivs(cur_positions);
  vec2 y_derivs = get_y_derivs(cur_positions);
  vec2 phi_gradient = vec2(x_derivs.x, y_derivs.x);
  vec2 theta_gradient = vec2(x_derivs.y, y_derivs.y);
  
  return vec2(
    calculate_wave_equation(cur_positions.x, old_positions.x, phi_gradient),
    calculate_wave_equation(cur_positions.y, old_positions.y, theta_gradient)
  );
}

bool outsideScrollZone(vec2 uv) {
  return length(uv - vec2(0.,1.)) > scroll_position;
}

void main() {
  vec2 cur_positions = get_texture_values(vUv).rg;
  vec2 old_positions = get_texture_values(vUv).ba;
  vec2 new_positions;
  //if it's outside our scroll zone
  if (outsideScrollZone(vUv)) {
    new_positions = get_next_positions(cur_positions, old_positions);
  } else {  //if it's inside our scroll zone
    new_positions = vec2(0.85, 0.85);
  }  
  new_positions = clamp(new_positions, 0., 1.);
  //Discard values that are less than min amount
  gl_FragColor = vec4(new_positions, cur_positions);
}
