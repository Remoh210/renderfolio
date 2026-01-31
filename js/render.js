import { mat4 } from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/index.js';

export default class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl');
    this.shaderVersion = options.shaderVersion || '1.0.5';
    this.gridSize = options.gridSize || 120;
    this.gridSpacing = options.gridSpacing || 0.16;
    this.waveHeight = options.waveHeight || 0.6;
    this.waveScale = options.waveScale || 0.9;
    this.waveSpeed = options.waveSpeed || 1.0;
    this.waveChop = options.waveChop || 0.7;
    this.fbmStrength = options.fbmStrength || 0.15;
    this.fbmOctaves = options.fbmOctaves || 5;
    this.fbmLacunarity = options.fbmLacunarity || 2.0;
    this.fbmGain = options.fbmGain || 0.5;
    this.mode = typeof options.mode === 'number' ? options.mode : 2;
    this.cameraEye = options.cameraEye || [0, 6, 12];
    this.cameraTarget = options.cameraTarget || [0, 0, 0];
    this.cameraUp = options.cameraUp || [0, 1, 0];

    this.dpr = window.devicePixelRatio || 1;
    this.projection = mat4.create();
    this.view = mat4.create();
    this.running = false;
  }

  async init() {
    if (!this.gl) {
      console.error('WebGL not supported in this browser.');
      return;
    }

    const gl = this.gl;

    try {
      const [vertShaderSrc, fragShaderSrc] = await Promise.all([
        this.loadText('../shaders/vertex.glsl'),
        this.loadText('../shaders/fragment.glsl'),
      ]);

      this.program = this.createProgram(vertShaderSrc, fragShaderSrc);
      gl.useProgram(this.program);

      const grid = this.createGrid(this.gridSize, this.gridSize, this.gridSpacing);
      this.indexCountLines = grid.lineIndices.length;
      this.indexCountTris = grid.triIndices.length;

      this.positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, grid.vertices, gl.STATIC_DRAW);

      this.lineIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.lineIndices, gl.STATIC_DRAW);

      this.triIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.triIndices, gl.STATIC_DRAW);

      this.posAttrib = gl.getAttribLocation(this.program, 'a_position');
      gl.enableVertexAttribArray(this.posAttrib);
      gl.vertexAttribPointer(this.posAttrib, 3, gl.FLOAT, false, 0, 0);

      this.uProjection = gl.getUniformLocation(this.program, 'u_projection');
      this.uView = gl.getUniformLocation(this.program, 'u_view');
      this.uTime = gl.getUniformLocation(this.program, 'u_time');
      this.uWaveHeight = gl.getUniformLocation(this.program, 'u_waveHeight');
      this.uWaveScale = gl.getUniformLocation(this.program, 'u_waveScale');
      this.uWaveSpeed = gl.getUniformLocation(this.program, 'u_waveSpeed');
      this.uWaveChop = gl.getUniformLocation(this.program, 'u_waveChop');
      this.uFbmStrength = gl.getUniformLocation(this.program, 'u_fbmStrength');
      this.uFbmOctaves = gl.getUniformLocation(this.program, 'u_fbmOctaves');
      this.uFbmLacunarity = gl.getUniformLocation(this.program, 'u_fbmLacunarity');
      this.uFbmGain = gl.getUniformLocation(this.program, 'u_fbmGain');
      this.uMode = gl.getUniformLocation(this.program, 'u_mode');

      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0, 0, 0, 1);

      this.resizeCanvasToDisplaySize();
      mat4.lookAt(this.view, this.cameraEye, this.cameraTarget, this.cameraUp);

      this.running = true;
      requestAnimationFrame(this.render.bind(this));
    } catch (err) {
      console.error(err);
    }
  }

  resizeCanvasToDisplaySize() {
    this.dpr = window.devicePixelRatio || 1;
    const width = Math.floor(window.innerWidth * this.dpr);
    const height = Math.floor(window.innerHeight * this.dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  render(time) {
    if (!this.running) {
      return;
    }

    const gl = this.gl;

    this.resizeCanvasToDisplaySize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const aspect = this.canvas.width / this.canvas.height;
    mat4.perspective(this.projection, Math.PI / 3, aspect, 0.1, 100);

    gl.uniformMatrix4fv(this.uProjection, false, this.projection);
    gl.uniformMatrix4fv(this.uView, false, this.view);
    gl.uniform1f(this.uTime, time * 0.001);
    gl.uniform1f(this.uWaveHeight, this.waveHeight);
    gl.uniform1f(this.uWaveScale, this.waveScale);
    gl.uniform1f(this.uWaveSpeed, this.waveSpeed);
    gl.uniform1f(this.uWaveChop, this.waveChop);
    gl.uniform1f(this.uFbmStrength, this.fbmStrength);
    gl.uniform1i(this.uFbmOctaves, this.fbmOctaves);
    gl.uniform1f(this.uFbmLacunarity, this.fbmLacunarity);
    gl.uniform1f(this.uFbmGain, this.fbmGain);
    gl.uniform1i(this.uMode, this.mode);

    if (this.mode === 2) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lineIndexBuffer);
      gl.drawElements(gl.LINES, this.indexCountLines, gl.UNSIGNED_SHORT, 0);
    } else {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.triIndexBuffer);
      gl.drawElements(gl.TRIANGLES, this.indexCountTris, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(this.render.bind(this));
  }

  async loadText(relativePath) {
    const url = new URL(`${relativePath}?v=${this.shaderVersion}`, import.meta.url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }
    return response.text();
  }

  compileShader(source, type) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${log}`);
    }

    return shader;
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const program = gl.createProgram();
    const vertexShader = this.compileShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, gl.FRAGMENT_SHADER);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Program link failed: ${log}`);
    }

    return program;
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

  setMode(mode) {
    this.mode = mode;
  }

  setParams(params = {}) {
    if (typeof params.waveHeight === 'number') {
      this.waveHeight = params.waveHeight;
    }
    if (typeof params.waveScale === 'number') {
      this.waveScale = params.waveScale;
    }
    if (typeof params.waveSpeed === 'number') {
      this.waveSpeed = params.waveSpeed;
    }
    if (typeof params.waveChop === 'number') {
      this.waveChop = params.waveChop;
    }
    if (typeof params.fbmStrength === 'number') {
      this.fbmStrength = params.fbmStrength;
    }
    if (typeof params.fbmOctaves === 'number') {
      this.fbmOctaves = params.fbmOctaves;
    }
    if (typeof params.fbmLacunarity === 'number') {
      this.fbmLacunarity = params.fbmLacunarity;
    }
    if (typeof params.fbmGain === 'number') {
      this.fbmGain = params.fbmGain;
    }
  }
}
