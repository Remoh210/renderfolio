precision mediump float;

uniform int u_mode;

varying vec3 v_normal;
varying float v_height;

vec3 heatColor(float t) {
  vec3 cool = vec3(0.05, 0.6, 1.0);
  vec3 hot = vec3(1.0, 0.15, 0.05);
  return mix(cool, hot, t);
}

void main() {
  vec3 normal = normalize(v_normal);

  if (u_mode == 1) {
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
    return;
  }

  if (u_mode == 2) {
    gl_FragColor = vec4(1.0);
    return;
  }

  if (u_mode == 3) {
    float slope = 1.0 - clamp(normal.y, 0.0, 1.0);
    gl_FragColor = vec4(heatColor(slope), 1.0);
    return;
  }

  vec3 base = vec3(0.05, 0.2, 0.45) + v_height * 0.08;
  gl_FragColor = vec4(base, 1.0);
}
