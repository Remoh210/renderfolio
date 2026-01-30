const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  console.error('WebGL not supported in this browser.');
}

let mouse = [0, 0];
let dpr = window.devicePixelRatio || 1;

function updateMouse(e) {
  mouse = [e.clientX * dpr, (window.innerHeight - e.clientY) * dpr];
}

window.addEventListener('mousemove', updateMouse);

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

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]),
      gl.STATIC_DRAW
    );

    const posAttrib = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttrib);
    gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    function render(time) {
      resizeCanvasToDisplaySize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestAnimationFrame(render);
    }

    resizeCanvasToDisplaySize();
    requestAnimationFrame(render);
  } catch (err) {
    console.error(err);
  }
}

init();
