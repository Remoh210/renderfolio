precision mediump float;

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  // Center around mouse
  vec2 mouse = u_mouse / u_resolution;
  vec2 pos = uv - mouse;

  // Distance from mouse
  float dist = length(pos);

  // Ripple effect
  float ripple = sin(10.0 * dist - u_time * 5.0);
  ripple /= 10.0 + 10.0 * dist;

  // Color gradient
  vec3 color = vec3(0.0, 0.3, 0.7) + ripple;

  gl_FragColor = vec4(color, 1.0);
}