const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  console.error('WebGL not supported in this browser.');
}

let dpr = window.devicePixelRatio || 1;

function resizeCanvasToDisplaySize() {
  dpr = window.devicePixelRatio || 1;
  const width = Math.floor(window.innerWidth * dpr);
  const height = Math.floor(window.innerHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function compileShader(source, type) {
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

function createProgram(vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertexShader = compileShader(vertexSource, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentSource, gl.FRAGMENT_SHADER);

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

async function loadText(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.text();
}

function createGrid(rows, cols, spacing) {
  const vertices = [];
  const indices = [];

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
      indices.push(index(x, z), index(x + 1, z));
    }
  }

  for (let x = 0; x < cols; x += 1) {
    for (let z = 0; z < rows - 1; z += 1) {
      indices.push(index(x, z), index(x, z + 1));
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint16Array(indices),
  };
}

function mat4Perspective(fovY, aspect, near, far) {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0,
  ];
}

function mat4LookAt(eye, target, up) {
  const zx = eye[0] - target[0];
  const zy = eye[1] - target[1];
  const zz = eye[2] - target[2];
  let zLen = Math.hypot(zx, zy, zz);
  const z0 = zx / zLen;
  const z1 = zy / zLen;
  const z2 = zz / zLen;

  const xx = up[1] * z2 - up[2] * z1;
  const xy = up[2] * z0 - up[0] * z2;
  const xz = up[0] * z1 - up[1] * z0;
  let xLen = Math.hypot(xx, xy, xz);
  const x0 = xx / xLen;
  const x1 = xy / xLen;
  const x2 = xz / xLen;

  const y0 = z1 * x2 - z2 * x1;
  const y1 = z2 * x0 - z0 * x2;
  const y2 = z0 * x1 - z1 * x0;

  return [
    x0, y0, z0, 0,
    x1, y1, z1, 0,
    x2, y2, z2, 0,
    -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]),
    -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]),
    -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]),
    1,
  ];
}

async function init() {
  if (!gl) {
    return;
  }

  try {
    const [vertShaderSrc, fragShaderSrc] = await Promise.all([
      loadText('../shaders/vertex.glsl'),
      loadText('../shaders/fragment.glsl'),
    ]);

    const program = createProgram(vertShaderSrc, fragShaderSrc);
    gl.useProgram(program);

    const grid = createGrid(120, 120, 0.16);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, grid.vertices, gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.indices, gl.STATIC_DRAW);

    const posAttrib = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 3, gl.FLOAT, false, 0, 0);

    const uProjection = gl.getUniformLocation(program, 'u_projection');
    const uView = gl.getUniformLocation(program, 'u_view');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uWaveHeight = gl.getUniformLocation(program, 'u_waveHeight');
    const uWaveScale = gl.getUniformLocation(program, 'u_waveScale');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);

    function render(time) {
      resizeCanvasToDisplaySize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const aspect = canvas.width / canvas.height;
      const projection = mat4Perspective(Math.PI / 3, aspect, 0.1, 100);
      const view = mat4LookAt([0, 6, 12], [0, 0, 0], [0, 1, 0]);

      gl.uniformMatrix4fv(uProjection, false, projection);
      gl.uniformMatrix4fv(uView, false, view);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform1f(uWaveHeight, 0.6);
      gl.uniform1f(uWaveScale, 0.9);

      gl.drawElements(gl.LINES, grid.indices.length, gl.UNSIGNED_SHORT, 0);
      requestAnimationFrame(render);
    }

    resizeCanvasToDisplaySize();
    requestAnimationFrame(render);
  } catch (err) {
    console.error(err);
  }
}

init();
