attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_time;
uniform float u_waveHeight;
uniform float u_waveScale;

varying vec3 v_normal;
varying float v_height;

void main() {
  float s = u_waveScale;
  float t = u_time;
  float waveA = sin((a_position.x + t) * s);
  float waveB = cos((a_position.z + t * 0.8) * (s * 0.8));
  float waveC = sin((a_position.x + a_position.z + t * 0.6) * (s * 0.5));
  float height = (waveA + waveB + waveC) * u_waveHeight;

  float dhdx = (cos((a_position.x + t) * s) * s
    + cos((a_position.x + a_position.z + t * 0.6) * (s * 0.5)) * (s * 0.5))
    * u_waveHeight;

  float dhdz = (-sin((a_position.z + t * 0.8) * (s * 0.8)) * (s * 0.8)
    + cos((a_position.x + a_position.z + t * 0.6) * (s * 0.5)) * (s * 0.5))
    * u_waveHeight;

  vec3 displaced = vec3(a_position.x, height, a_position.z);
  v_normal = normalize(vec3(-dhdx, 1.0, -dhdz));
  v_height = height;
  gl_Position = u_projection * u_view * vec4(displaced, 1.0);
}
