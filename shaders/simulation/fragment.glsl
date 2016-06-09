precision highp float;

varying vec2 vUv;

uniform float wave_speed;
uniform float damping_strength;
uniform float mouse_magnitude;
uniform float draw_radius;
uniform float dx;
uniform float dy;
uniform float width;
uniform float height;
uniform vec2 mouse;

uniform sampler2D position_texture;

vec4 get_texture_values(in vec2 tex_coords) {
  return texture2D(position_texture, tex_coords);
}

float fd_central(in float left, in float center, in float right, in float offset) {
  return (right + left - (2.0 * center)) * pow(offset, -2.);
}

float get_x_deriv(in float center) {
  vec2 left_uv  = vUv - vec2(dx, 0.);
  vec2 right_uv = vUv + vec2(dx, 0.);
  float sign_left  = sign(left_uv.x);
  float sign_right = sign(1. - right_uv.x);
  float left   = clamp(-sign_left, 0., 1.) + sign_left * get_texture_values(left_uv).r;
  float right  = clamp(-sign_right, 0., 1.) + sign_right * get_texture_values(right_uv).r;
  return fd_central(left, center, right, dx);
}

float get_y_deriv(in float center) {
  vec2 top_uv    = vUv + vec2(0., dy);
  vec2 bottom_uv = vUv - vec2(0., dy);
  float sign_top = sign(1. - top_uv.y);
  float sign_bot = sign(bottom_uv.y);
  float top    = clamp(-sign_top, 0., 1.) + sign_top * get_texture_values(top_uv).r;
  float bottom = clamp(-sign_bot, 0., 1.) + sign_bot * get_texture_values(bottom_uv).r;
  return fd_central(bottom, center, top, dy);
}

float get_next_position() {
  float cur_position = get_texture_values(vUv).r;
  float old_position = get_texture_values(vUv).g;
  vec2 gradient = vec2(get_x_deriv(cur_position), get_y_deriv(cur_position));
  
  vec2 wave_speeds = pow(wave_speed, 2.) * vec2(pow(height/width, 2.), 1.);
  
  float damping_factor = 1. / (1. + damping_strength);
  return damping_factor * (
      (damping_strength - 1.) * old_position
      + 2. * cur_position
      + dot(wave_speeds, gradient));
}

float calculate_mouse_impact(vec2 uv) {
  // We need to scale our distance depending on our height/width
  float mouse_distance = length(vec2(1, height/width) * vec2(mouse - uv));
  return mouse_magnitude * max(sign(draw_radius - mouse_distance), 0.0);
}


void main() {
  float cur_position = get_texture_values(vUv).r;
  float new_position = get_next_position();
  float mouse_impact = calculate_mouse_impact(vUv);
  float final_value = clamp(new_position + mouse_impact, 0., 1.);
  gl_FragColor = vec4(final_value, cur_position, 1.0, 1.0);
}
