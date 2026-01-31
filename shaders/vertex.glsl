attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_time;
uniform float u_waveHeight;
uniform float u_waveScale;

void main() {
  float waveA = sin((a_position.x + u_time) * u_waveScale);
  float waveB = cos((a_position.z + u_time * 0.8) * (u_waveScale * 0.8));
  float waveC = sin((a_position.x + a_position.z + u_time * 0.6) * (u_waveScale * 0.5));
  float height = (waveA + waveB + waveC) * u_waveHeight;

  vec3 displaced = vec3(a_position.x, height, a_position.z);
  gl_Position = u_projection * u_view * vec4(displaced, 1.0);
}
