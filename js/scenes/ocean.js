import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export default class OceanScene {
  constructor(settings) {
    this.settings = { ...settings };
    this.mode = settings.mode;
    this.projection = mat4.create();
    this.view = mat4.create();

    this.params = {
      waveHeight: settings.waveHeight,
      waveScale: settings.waveScale,
      waveSpeed: settings.waveSpeed,
      waveChop: settings.waveChop,
      fbmStrength: settings.fbmStrength,
      fbmOctaves: settings.fbmOctaves,
      fbmLacunarity: settings.fbmLacunarity,
      fbmGain: settings.fbmGain,
    };

    this.camera = {
      eye: settings.cameraEye,
      target: settings.cameraTarget,
      up: settings.cameraUp,
    };
  }

  getMesh() {
    if (this.mesh) {
      return this.mesh;
    }

    const grid = this.createGrid(
      this.settings.gridSize,
      this.settings.gridSize,
      this.settings.gridSpacing
    );

    this.mesh = {
      attributes: {
        a_position: {
          data: grid.vertices,
          size: 3,
        },
      },
      indices: grid.triIndices,
      wireIndices: grid.lineIndices,
    };

    return this.mesh;
  }

  getFrame({ time, aspect }) {
    mat4.perspective(this.projection, Math.PI / 3, aspect, 0.1, 100);
    mat4.lookAt(
      this.view,
      this.camera.eye,
      this.camera.target,
      this.camera.up
    );

    return {
      drawMode: this.mode === 2 ? 'lines' : 'triangles',
      uniforms: {
        u_projection: this.projection,
        u_view: this.view,
        u_time: time,
        u_waveHeight: this.params.waveHeight,
        u_waveScale: this.params.waveScale,
        u_waveSpeed: this.params.waveSpeed,
        u_waveChop: this.params.waveChop,
        u_fbmStrength: this.params.fbmStrength,
        u_fbmOctaves: { type: '1i', value: this.params.fbmOctaves },
        u_fbmLacunarity: this.params.fbmLacunarity,
        u_fbmGain: this.params.fbmGain,
        u_mode: { type: '1i', value: this.mode },
      },
    };
  }

  setMode(mode) {
    this.mode = mode;
  }

  setParams(params = {}) {
    Object.entries(params).forEach(([key, value]) => {
      if (key in this.params && typeof value === 'number') {
        this.params[key] = value;
      }
    });
  }

  createGrid(rows, cols, spacing) {
    const vertices = [];
    const lineIndices = [];
    const triIndices = [];

    const width = (cols - 1) * spacing;
    const depth = (rows - 1) * spacing;
    const xOffset = width / 2;
    const zOffset = depth / 2;

    for (let z = 0; z < rows; z += 1) {
      for (let x = 0; x < cols; x += 1) {
        vertices.push(x * spacing - xOffset, 0, z * spacing - zOffset);
      }
    }

    const index = (x, z) => z * cols + x;

    for (let z = 0; z < rows; z += 1) {
      for (let x = 0; x < cols - 1; x += 1) {
        lineIndices.push(index(x, z), index(x + 1, z));
      }
    }

    for (let x = 0; x < cols; x += 1) {
      for (let z = 0; z < rows - 1; z += 1) {
        lineIndices.push(index(x, z), index(x, z + 1));
      }
    }

    for (let z = 0; z < rows - 1; z += 1) {
      for (let x = 0; x < cols - 1; x += 1) {
        const i0 = index(x, z);
        const i1 = index(x + 1, z);
        const i2 = index(x, z + 1);
        const i3 = index(x + 1, z + 1);
        triIndices.push(i0, i2, i1);
        triIndices.push(i1, i2, i3);
      }
    }

    return {
      vertices: new Float32Array(vertices),
      lineIndices: new Uint16Array(lineIndices),
      triIndices: new Uint16Array(triIndices),
    };
  }
}
