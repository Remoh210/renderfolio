import Renderer from './render.js?v=1.0.3';
import { APP_VERSION, SHADER_VERSION, SETTINGS, MODES } from './config.js?v=1.0.3';

const canvas = document.getElementById('glCanvas');
const renderer = new Renderer(canvas, {
  shaderVersion: SHADER_VERSION,
  gridSize: SETTINGS.gridSize,
  gridSpacing: SETTINGS.gridSpacing,
  waveHeight: SETTINGS.waveHeight,
  waveScale: SETTINGS.waveScale,
  waveSpeed: SETTINGS.waveSpeed,
  mode: SETTINGS.mode,
  cameraEye: SETTINGS.cameraEye,
  cameraTarget: SETTINGS.cameraTarget,
  cameraUp: SETTINGS.cameraUp,
});

renderer.init();

const ui = document.getElementById('ui');
ui.innerHTML = `
  <div class="ui-title">Debug View</div>
  <div class="ui-version">v${APP_VERSION}</div>
  <div class="ui-hint">Keys: 1-4 or B N W H</div>
  <div class="ui-modes"></div>
  <div class="ui-sliders"></div>
`;

const modesContainer = ui.querySelector('.ui-modes');
const modeButtons = new Map();

function setMode(modeId) {
  renderer.setMode(modeId);
  modeButtons.forEach((button, id) => {
    button.classList.toggle('is-active', id === modeId);
  });
}

MODES.forEach((mode) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = `${mode.keys[0].toUpperCase()} ${mode.name}`;
  button.dataset.mode = String(mode.id);
  button.addEventListener('click', () => setMode(mode.id));
  modesContainer.appendChild(button);
  modeButtons.set(mode.id, button);
});

setMode(SETTINGS.mode);

const sliderContainer = ui.querySelector('.ui-sliders');
const sliderDefs = [
  { id: 'waveHeight', label: 'Wave Height', min: 0, max: 1.5, step: 0.01, value: SETTINGS.waveHeight },
  { id: 'waveScale', label: 'Wave Scale', min: 0.2, max: 2.0, step: 0.01, value: SETTINGS.waveScale },
  { id: 'waveSpeed', label: 'Wave Speed', min: 0.2, max: 2.5, step: 0.01, value: SETTINGS.waveSpeed },
];

sliderDefs.forEach((def) => {
  const row = document.createElement('label');
  row.className = 'ui-slider';

  const title = document.createElement('span');
  title.className = 'ui-label';
  title.textContent = def.label;

  const input = document.createElement('input');
  input.type = 'range';
  input.min = def.min;
  input.max = def.max;
  input.step = def.step;
  input.value = def.value;

  const value = document.createElement('span');
  value.className = 'ui-value';
  value.textContent = Number(def.value).toFixed(2);

  input.addEventListener('input', () => {
    const numeric = Number(input.value);
    value.textContent = numeric.toFixed(2);
    renderer.setParams({ [def.id]: numeric });
  });

  row.appendChild(title);
  row.appendChild(input);
  row.appendChild(value);
  sliderContainer.appendChild(row);
});

const keyToMode = new Map();
MODES.forEach((mode) => {
  mode.keys.forEach((key) => keyToMode.set(key, mode.id));
});

window.addEventListener('keydown', (event) => {
  if (event.target && event.target.tagName === 'INPUT') {
    return;
  }
  const key = event.key.toLowerCase();
  if (keyToMode.has(key)) {
    setMode(keyToMode.get(key));
  }
});
