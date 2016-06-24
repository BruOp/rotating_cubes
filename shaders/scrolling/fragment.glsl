#define MIN_VAL 0.01
#define PI_INVERSE 0.31830988618

precision highp float;

varying vec2 vUv;
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

bool outsideScrollZone(vec2 uv) {
  return length(uv - scroll_origin) > scroll_position;
  // return uv.y > dy * width * (scroll_position - uv.x);  
}

float get_next_position(float cur_position) {
  float jitter_coeff = when_lt(abs(cur_position - final_scroll_value), rotation_rate);
  float next_position = cur_position + sign(final_scroll_value - cur_position) * rotation_rate;
  return jitter_coeff * final_scroll_value + (1.0 - jitter_coeff) * next_position;
}

void main() {
  float cur_position = texture2D(position_texture, vUv).r;
  float new_position;  
  if (outsideScrollZone(vUv)) {
    new_position = cur_position;
  } else {
    new_position = get_next_position(cur_position);
  }
  new_position = clamp(new_position, 0., 1.);  
  gl_FragColor = vec4(new_position, cur_position, 1.0, 1.);
}
