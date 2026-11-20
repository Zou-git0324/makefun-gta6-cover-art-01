// Vice Cover Studio — wires the editor: pick a layout, a post size and a colour
// grade, load a photo into each panel (your own file or a sample), crop it with
// zoom and pan, write the caption, and export the cover as a PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).

import { drawCover, GRADES } from './cover.js';
import { layoutPanelCount, blankPanel } from './panels.js';
import { runShot } from './shots.js';

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

const canvas = document.getElementById('cover');
const status = document.getElementById('status');

/** The whole cover state; panels are rebuilt when the layout changes. */
export const state = {
  layout: 'poster',
  size: '1080x1350',
  grade: 'sunset',
  title: 'Neon Heist',
  subtitle: 'Vice Coast',
  panels: [blankPanel(), blankPanel(), blankPanel()],
};

let activePanel = 0;

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Rebuilds the panel list for the current layout, keeping photos already loaded. */
export function applyLayout(layout) {
  const old = state.panels;
  state.layout = layout;
  state.panels = Array.from({ length: layoutPanelCount(layout) }, (_, i) => old[i] || blankPanel());
  if (activePanel >= state.panels.length) activePanel = 0;
}

/** Applies the chosen post size to the canvas, then redraws. */
export function applySize(key) {
  state.size = key;
  const size = SIZES[key];
  canvas.width = size.w;
  canvas.height = size.h;
  redraw();
}

/** Draws the current state onto the preview canvas. */
export function redraw() {
  drawCover(canvas, state);
  syncPanelControls();
}

/** Copies the active panel's zoom / pan into the sliders. */
function syncPanelControls() {
  const panel = state.panels[activePanel];
  if (!panel) return;
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('panx');
  const panY = document.getElementById('pany');
  if (zoom) zoom.value = panel.zoom;
  if (panX) panX.value = panel.dx;
  if (panY) panY.value = panel.dy;
  document.querySelectorAll('#panel-picker button').forEach((b, i) => {
    b.classList.toggle('active', i === activePanel);
    b.textContent = `Panel ${i + 1}${state.panels[i] && state.panels[i].img ? ' ✓' : ''}`;
  });
}

/** Builds the panel picker buttons for the current layout. */
function buildPanelPicker() {
  const picker = document.getElementById('panel-picker');
  picker.innerHTML = '';
  state.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.addEventListener('click', () => { activePanel = i; syncPanelControls(); });
    picker.appendChild(b);
  });
  syncPanelControls();
}

/** Marks a button group (layout / grade) with the chosen value. */
function markGroup(id, value) {
  document.querySelectorAll(`#${id} button`).forEach((b) => {
    b.classList.toggle('active', b.dataset.value === value);
  });
}

/** Exports the current cover as a PNG file at the chosen post size. */
export function exportCover() {
  canvas.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved vice-cover-${state.size}.png (${SIZES[state.size].w} x ${SIZES[state.size].h})`;
  }, 'image/png');
}

function wire() {
  document.querySelectorAll('#layout button').forEach((b) => {
    b.addEventListener('click', () => {
      applyLayout(b.dataset.value);
      buildPanelPicker();
      markGroup('layout', state.layout);
      redraw();
    });
  });
  document.querySelectorAll('#grade button').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.value;
      markGroup('grade', state.grade);
      redraw();
    });
  });
  document.getElementById('size').addEventListener('change', (e) => applySize(e.target.value));
  document.getElementById('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  document.getElementById('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });

  document.getElementById('photo').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.panels[activePanel].img = await loadImage(URL.createObjectURL(file));
    status.textContent = `Photo loaded into panel ${activePanel + 1}.`;
    redraw();
  });
  document.querySelectorAll('[data-sample]').forEach((b) => {
    b.addEventListener('click', async () => {
      state.panels[activePanel].img = await loadImage(`samples/${b.dataset.sample}.jpg`);
      status.textContent = `Sample photo loaded into panel ${activePanel + 1}.`;
      redraw();
    });
  });
  document.getElementById('fill-all').addEventListener('click', () => {
    const img = state.panels[activePanel].img;
    if (!img) { status.textContent = 'Load a photo into this panel first.'; return; }
    state.panels.forEach((p) => { p.img = img; });
    status.textContent = 'Same photo in every panel — crop each one differently.';
    redraw();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.panels[activePanel].zoom = Number(e.target.value);
    redraw();
  });
  document.getElementById('panx').addEventListener('input', (e) => {
    state.panels[activePanel].dx = Number(e.target.value);
    redraw();
  });
  document.getElementById('pany').addEventListener('input', (e) => {
    state.panels[activePanel].dy = Number(e.target.value);
    redraw();
  });
  document.getElementById('export').addEventListener('click', exportCover);

  buildPanelPicker();
  markGroup('layout', state.layout);
  markGroup('grade', state.grade);
  document.getElementById('size').value = state.size;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
}

wire();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { state, applyLayout, applySize, loadImage, redraw });
} else if (params.get('selftest')) {
  // Headless check: draw, export to a blob, report its size in the page.
  (async () => {
    await document.fonts.load('100px Anton');
    applySize(state.size);
    canvas.toBlob((blob) => {
      const div = document.createElement('div');
      div.id = 'selftest';
      div.textContent = `export-bytes:${blob ? blob.size : 0}`;
      document.body.appendChild(div);
      window.__shotReady = true;
    }, 'image/png');
  })();
} else {
  applySize(state.size);
}
