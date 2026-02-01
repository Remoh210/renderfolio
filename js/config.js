export const APP_VERSION = '1.0.6';
export const SHADER_VERSION = '1.0.6';

export const SETTINGS = {
  gridSize: 120,
  gridSpacing: 0.16,
  waveHeight: 0.55,
  waveScale: 0.85,
  waveSpeed: 1.0,
  waveChop: 0.7,
  fbmStrength: 0.12,
  fbmOctaves: 4,
  fbmLacunarity: 2.2,
  fbmGain: 0.55,
  mode: 2,
  cameraEye: [0, 6, 12],
  cameraTarget: [0, 0, 0],
  cameraUp: [0, 1, 0],
};

export const MODES = [
  {
    id: 2,
    name: 'Wireframe',
    keys: ['1', 'w'],
    panel: {
      eyebrow: 'C++ & Unreal Engine',
      headline: 'Engine-level problem solving and pipelines',
      body: 'I build tools and rendering workflows in C++ and Unreal Engine, with an emphasis on structure, data flow, and scalable systems.',
    },
  },
  {
    id: 0,
    name: 'Base Color',
    keys: ['2', 'b'],
    panel: {
      eyebrow: 'About Me',
      headline: 'Systems-minded technologist with a visual edge',
      body: 'I build real-time visuals with a systems-first mindset, balancing artistry with performance. My work bridges engine-level logic, rendering, and interaction.',
    },
  },
  {
    id: 1,
    name: 'Normals',
    keys: ['3', 'n'],
    panel: {
      eyebrow: 'Rendering Projects',
      headline: 'Shader-driven worlds and real-time rendering',
      body: 'From water surfaces to stylized debug views, I prototype visuals with a focus on lighting, shading, and technical art direction.',
    },
  },
  {
    id: 3,
    name: 'Heatmap',
    keys: ['4', 'h'],
    panel: {
      eyebrow: 'Performance Optimization',
      headline: 'Profiling, GPU budgets, and real-time efficiency',
      body: 'I optimize shader cost, memory, and draw calls using profiling tools, ensuring visuals stay fast and responsive at scale.',
    },
  },
];
