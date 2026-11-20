// Fixed scenes for screenshots: ?shot=editor shows the editor with photos loaded;
// ?shot=cover shows the exported cover alone, filling the frame.
// Query: layout, size (WxH), grade, title, subtitle, photos (comma list of samples).
// window.__shotReady is set once the scene is painted.

/** Loads sample photos into the panels, one name per panel, cycling the list. */
async function loadPhotos(api, names) {
  for (let i = 0; i < api.state.panels.length; i++) {
    const name = names[i % names.length] || 'pier';
    api.state.panels[i].img = await api.loadImage(`samples/${name}.jpg`);
    api.state.panels[i].zoom = 1 + (i % 3) * 0.15;
    api.state.panels[i].dx = (i % 2 ? -0.06 : 0.05);
    api.state.panels[i].dy = (i % 3 - 1) * 0.04;
  }
}

export async function runShot(shot, query, api) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    // Size the canvas to the real viewport in script: headless Chrome's vh units
    // can come up short of the window, which letterboxes the cover.
    const coverCanvas = document.getElementById('cover');
    coverCanvas.style.width = `${window.innerWidth}px`;
    coverCanvas.style.height = `${window.innerHeight}px`;
  }
  const layout = query.get('layout') || 'poster';
  const size = query.get('size') || '1080x1350';
  const grade = query.get('grade') || 'sunset';
  api.applyLayout(layout);
  api.state.grade = grade;
  api.state.title = query.get('title') || 'Neon Heist';
  api.state.subtitle = query.get('subtitle') || 'Vice Coast';
  const sizeEl = document.getElementById('size');
  if (sizeEl) sizeEl.value = size;
  const titleEl = document.getElementById('title');
  if (titleEl) titleEl.value = api.state.title;
  const subEl = document.getElementById('subtitle');
  if (subEl) subEl.value = api.state.subtitle;
  document.querySelectorAll('#layout button').forEach((b) => b.classList.toggle('active', b.dataset.value === layout));
  document.querySelectorAll('#grade button').forEach((b) => b.classList.toggle('active', b.dataset.value === grade));
  try { await document.fonts.load('100px Anton'); } catch { /* system font fallback */ }
  await loadPhotos(api, (query.get('photos') || 'pier,boulevard').split(','));
  api.applySize(size);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
