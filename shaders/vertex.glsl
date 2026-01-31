attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform float u_time;
uniform float u_waveHeight;
uniform float u_waveScale;
uniform float u_waveSpeed;
uniform float u_waveChop;
uniform float u_fbmStrength;
uniform float u_fbmLacunarity;
uniform float u_fbmGain;
uniform int u_fbmOctaves;

varying vec3 v_normal;
varying float v_height;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 6; i++) {
    if (i >= u_fbmOctaves) {
      break;
    }
    value += amplitude * noise(p * frequency);
    frequency *= u_fbmLacunarity;
    amplitude *= u_fbmGain;
  }

  return value;
}

vec3 gerstnerWave(vec2 p, vec2 dir, float k, float amp, float speed, float chop, float t) {
  float phase = k * dot(dir, p) - speed * t;
  float cosP = cos(phase);
  float sinP = sin(phase);
  float q = chop / (k * max(amp, 0.001) * 4.0);
  return vec3(dir.x * (q * amp * cosP), amp * sinP, dir.y * (q * amp * cosP));
}

vec3 displacedAt(vec2 p, float t) {
  vec3 disp = vec3(p.x, 0.0, p.y);
  vec2 d0 = normalize(vec2(1.0, 0.25));
  vec2 d1 = normalize(vec2(0.1, 1.0));
  vec2 d2 = normalize(vec2(-0.8, 0.45));
  vec2 d3 = normalize(vec2(0.6, -0.9));

  float k0 = (6.2831853 / 7.0) * u_waveScale;
  float k1 = (6.2831853 / 4.0) * u_waveScale;
  float k2 = (6.2831853 / 2.5) * u_waveScale;
  float k3 = (6.2831853 / 1.6) * u_waveScale;

  float s0 = sqrt(9.8 / max(k0, 0.0001)) * u_waveSpeed;
  float s1 = sqrt(9.8 / max(k1, 0.0001)) * u_waveSpeed;
  float s2 = sqrt(9.8 / max(k2, 0.0001)) * u_waveSpeed;
  float s3 = sqrt(9.8 / max(k3, 0.0001)) * u_waveSpeed;

  disp += gerstnerWave(p, d0, k0, u_waveHeight * 0.6, s0, u_waveChop, t);
  disp += gerstnerWave(p, d1, k1, u_waveHeight * 0.35, s1, u_waveChop, t);
  disp += gerstnerWave(p, d2, k2, u_waveHeight * 0.22, s2, u_waveChop, t);
  disp += gerstnerWave(p, d3, k3, u_waveHeight * 0.14, s3, u_waveChop, t);

  vec2 flow = vec2(t * 0.15, t * 0.1);
  float detail = fbm(p * (u_waveScale * 1.1) + flow);
  disp.y += (detail * 2.0 - 1.0) * u_fbmStrength;

  return disp;
}

void main() {
  float t = u_time * u_waveSpeed;
  vec2 p = a_position.xz;
  vec3 displaced = displacedAt(p, t);

  float eps = 0.1;
  vec3 dispX = displacedAt(p + vec2(eps, 0.0), t);
  vec3 dispZ = displacedAt(p + vec2(0.0, eps), t);
  vec3 dx = dispX - displaced;
  vec3 dz = dispZ - displaced;

  v_normal = normalize(cross(dz, dx));
  v_height = displaced.y;
  gl_Position = u_projection * u_view * vec4(displaced, 1.0);
}
