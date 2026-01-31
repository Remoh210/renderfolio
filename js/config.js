export const APP_VERSION = '1.0.3';
export const SHADER_VERSION = '1.0.3';

export const SETTINGS = {
  gridSize: 120,
  gridSpacing: 0.16,
  waveHeight: 0.6,
  waveScale: 0.9,
  waveSpeed: 1.0,
  mode: 2,
  cameraEye: [0, 6, 12],
  cameraTarget: [0, 0, 0],
  cameraUp: [0, 1, 0],
};

export const MODES = [
  { id: 0, name: 'Base Color', keys: ['1', 'b'] },
  { id: 1, name: 'Normals', keys: ['2', 'n'] },
  { id: 2, name: 'Wireframe', keys: ['3', 'w'] },
  { id: 3, name: 'Heatmap', keys: ['4', 'h'] },
];
