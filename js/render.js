export default class Renderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl');
    this.clearColor = options.clearColor || [0, 0, 0, 1];
    this.dpr = window.devicePixelRatio || 1;
    this.running = false;
    this.uniformLocations = new Map();
  }

  async init({ vertexUrl, fragmentUrl, mesh }) {
    if (!this.gl) {
      console.error('WebGL not supported in this browser.');
      return;
    }

    const gl = this.gl;

    const [vertShaderSrc, fragShaderSrc] = await Promise.all([
      this.loadText(vertexUrl),
      this.loadText(fragmentUrl),
    ]);

    this.program = this.createProgram(vertShaderSrc, fragShaderSrc);
    gl.useProgram(this.program);

    if (mesh) {
      this.setMesh(mesh);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(...this.clearColor);
  }

  start(renderCallback) {
    if (!this.gl || !this.program) {
      return;
    }

    this.renderCallback = renderCallback;
    this.running = true;
    requestAnimationFrame(this.render.bind(this));
  }

  stop() {
    this.running = false;
  }

  render(timeMs) {
    if (!this.running) {
      return;
    }

    const gl = this.gl;

    this.resizeCanvasToDisplaySize();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (this.renderCallback) {
      const frame = this.renderCallback({
        time: timeMs * 0.001,
        width: this.canvas.width,
        height: this.canvas.height,
        aspect: this.canvas.width / this.canvas.height,
      });

      if (frame && frame.uniforms) {
        this.applyUniforms(frame.uniforms);
      }

      if (frame && frame.drawMode) {
        this.draw(frame.drawMode);
      }
    }

    requestAnimationFrame(this.render.bind(this));
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

  setMesh(mesh) {
    const gl = this.gl;
    this.mesh = mesh;
    this.attributes = [];

    if (mesh.attributes) {
      Object.entries(mesh.attributes).forEach(([name, attr]) => {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW);

        const location = gl.getAttribLocation(this.program, name);
        if (location >= 0) {
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, attr.size, gl.FLOAT, false, 0, 0);
        }

        this.attributes.push({ name, buffer, size: attr.size, location });
      });

      const firstAttr = Object.values(mesh.attributes)[0];
      this.vertexCount = firstAttr ? firstAttr.data.length / firstAttr.size : 0;
    }

    if (mesh.indices) {
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
      this.indexCount = mesh.indices.length;
      this.indexType = this.getIndexType(mesh.indices);
    }

    if (mesh.wireIndices) {
      this.wireIndexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireIndexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.wireIndices, gl.STATIC_DRAW);
      this.wireIndexCount = mesh.wireIndices.length;
      this.wireIndexType = this.getIndexType(mesh.wireIndices);
    }
  }

  draw(mode) {
    const gl = this.gl;

    if (mode === 'lines' && this.wireIndexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.wireIndexBuffer);
      gl.drawElements(gl.LINES, this.wireIndexCount, this.wireIndexType, 0);
      return;
    }

    if (this.indexBuffer) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
      return;
    }

    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount || 0);
  }

  applyUniforms(uniforms) {
    const gl = this.gl;

    Object.entries(uniforms).forEach(([name, entry]) => {
      const payload = entry && typeof entry === 'object' && 'value' in entry
        ? entry
        : { value: entry };

      const value = payload.value;
      const type = payload.type || this.inferUniformType(value);
      const location = this.getUniformLocation(name);

      if (location === null || location === undefined) {
        return;
      }

      if (type === '1f') {
        gl.uniform1f(location, value);
      } else if (type === '2f') {
        gl.uniform2f(location, value[0], value[1]);
      } else if (type === '3f') {
        gl.uniform3f(location, value[0], value[1], value[2]);
      } else if (type === '4f') {
        gl.uniform4f(location, value[0], value[1], value[2], value[3]);
      } else if (type === '1i') {
        gl.uniform1i(location, value);
      } else if (type === 'mat4') {
        gl.uniformMatrix4fv(location, false, value);
      }
    });
  }

  inferUniformType(value) {
    if (Array.isArray(value) || value instanceof Float32Array) {
      if (value.length === 16) {
        return 'mat4';
      }
      if (value.length === 4) {
        return '4f';
      }
      if (value.length === 3) {
        return '3f';
      }
      if (value.length === 2) {
        return '2f';
      }
    }

    return '1f';
  }

  getUniformLocation(name) {
    if (this.uniformLocations.has(name)) {
      return this.uniformLocations.get(name);
    }

    const location = this.gl.getUniformLocation(this.program, name);
    this.uniformLocations.set(name, location);
    return location;
  }

  getIndexType(indices) {
    if (indices instanceof Uint32Array) {
      const ext = this.gl.getExtension('OES_element_index_uint');
      if (!ext) {
        throw new Error('Uint32 indices require OES_element_index_uint.');
      }
      return this.gl.UNSIGNED_INT;
    }

    return this.gl.UNSIGNED_SHORT;
  }

  async loadText(url) {
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
}
