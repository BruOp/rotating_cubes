precision highp float;

uniform float width;
uniform float height;
uniform sampler2D map;

varying vec3 vNormal;
varying vec2 vUv;

float uFromNormal(vec3 normal) {
  return 0.25 * (normal.x + 1.) + 0.75 * floor(-(normal.z - 2.) / 3.);
}

float vFromNormal(vec3 normal) {
  return (normal.y - 1.) / -3.;
}

vec2 calculateUV(vec3 normal, vec2 uv) {
  vec2 normUV = vec2(uFromNormal(normal), vFromNormal(normal));
  return normUV + vec2(.25 * uv.x, .33333333 * uv.y);
}

void main() {
  
  vec2 uv = calculateUV(vNormal, vUv);
  gl_FragColor = texture2D(map, uv);
}
