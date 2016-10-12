precision highp float;

uniform float width;
uniform float height;

varying vec3 vColor;
varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
