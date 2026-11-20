// Vice Cover Studio — draws a multi-panel GTA-style poster cover onto a canvas.
// One photo per panel (or the same photo in several panels), a sunset / neon colour
// grade over each panel, white gutters between panels, and bold Anton lettering on
// a gradient title band. Everything is drawn with the 2D canvas API, no libraries.

import { panelRects } from './panels.js';

/** Colour grades: a top and bottom tint plus an optional canvas filter per panel. */
export const GRADES = {
  sunset: { top: 'rgba(255, 170, 60, 0.16)', bottom: 'rgba(255, 40, 120, 0.38)', filter: 'saturate(1.25) contrast(1.05)' },
  neon: { top: 'rgba(0, 229, 255, 0.20)', bottom: 'rgba(255, 0, 200, 0.34)', filter: 'saturate(1.35) contrast(1.08)' },
  golden: { top: 'rgba(255, 200, 90, 0.22)', bottom: 'rgba(255, 120, 30, 0.30)', filter: 'saturate(1.2) contrast(1.03)' },
  noir: { top: 'rgba(120, 140, 200, 0.12)', bottom: 'rgba(10, 10, 30, 0.42)', filter: 'grayscale(0.75) contrast(1.12)' },
};

/** Cover-fit draw of one photo inside a rect, with zoom and a pan offset. */
export function drawPanelPhoto(ctx, img, rect, zoom, dx, dy, filter) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const x = rect.x + (rect.w - pw) / 2 + dx * rect.w;
  const y = rect.y + (rect.h - ph) / 2 + dy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter || 'none';
  ctx.drawImage(img, x, y, pw, ph);
  ctx.filter = 'none';
  ctx.restore();
}

/** The grade tint and a soft vignette over one panel. */
export function gradePanel(ctx, rect, grade) {
  const tint = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  tint.addColorStop(0, grade.top);
  tint.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A low skyline silhouette along the bottom of a rect, for the poster feel. */
export function drawSkyline(ctx, rect, colour) {
  const base = rect.y + rect.h;
  const tops = [0.62, 0.45, 0.72, 0.38, 0.58, 0.5, 0.66, 0.42];
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(rect.x, base);
  const step = rect.w / tops.length;
  for (let i = 0; i < tops.length; i++) {
    const bx = rect.x + i * step;
    const top = base - rect.h * tops[i] * 0.55;
    ctx.lineTo(bx, top);
    ctx.lineTo(bx + step * 0.55, top);
    ctx.lineTo(bx + step * 0.55, base - rect.h * tops[i] * 0.28);
    ctx.lineTo(bx + step, base - rect.h * tops[i] * 0.28);
    ctx.lineTo(bx + step, base);
  }
  ctx.lineTo(rect.x + rect.w, base);
  ctx.closePath();
  ctx.fill();
}

/** Bold title lettering with a hard outline, fitted to the band width. */
export function drawTitle(ctx, text, band, size) {
  const words = text.trim().toUpperCase();
  if (!words) return;
  let px = size;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (;;) {
    ctx.font = `${px}px Anton, 'Arial Black', sans-serif`;
    if (ctx.measureText(words).width <= band.w * 0.92 || px <= 16) break;
    px -= 2;
  }
  const cx = band.x + band.w / 2;
  const cy = band.y + band.h * 0.52;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14081f';
  ctx.lineWidth = Math.max(3, px * 0.09);
  ctx.strokeText(words, cx, cy);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 60, 140, 0.55)';
  ctx.shadowBlur = px * 0.25;
  ctx.shadowOffsetY = px * 0.03;
  ctx.fillText(words, cx, cy);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

/**
 * Draws the whole cover. `state` is { layout, title, subtitle, grade, panels }
 * where panels[i] is { img, zoom, dx, dy } and img may be null (empty panel).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const gutter = Math.max(4, Math.round(w * 0.008));
  const bandH = Math.round(h * 0.17);
  const artH = h - bandH;
  const rects = panelRects(state.layout, w, artH, gutter);

  ctx.fillStyle = '#120a1c';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    ctx.fillStyle = '#241533';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    if (panel && panel.img) {
      drawPanelPhoto(ctx, panel.img, rect, panel.zoom || 1, panel.dx || 0, panel.dy || 0, grade.filter);
      gradePanel(ctx, rect, grade);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, gutter * 0.45);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Title band: hot gradient, skyline silhouette, then the lettering.
  const band = { x: 0, y: artH, w, h: bandH };
  const bg = ctx.createLinearGradient(0, band.y, w, band.y);
  bg.addColorStop(0, '#ff7a3d');
  bg.addColorStop(0.5, '#ff2e88');
  bg.addColorStop(1, '#7b2ff7');
  ctx.fillStyle = bg;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  ctx.save();
  ctx.globalAlpha = 0.22;
  drawSkyline(ctx, { x: 0, y: band.y, w, h: bandH }, '#1c0a2e');
  ctx.restore();
  drawTitle(ctx, state.title, { x: 0, y: band.y, w, h: bandH * 0.68 }, bandH * 0.62);

  // Subtitle: small letterspaced caps centred under the title.
  const sub = (state.subtitle || '').trim().toUpperCase();
  if (sub) {
    ctx.font = `bold ${Math.max(12, Math.round(bandH * 0.13))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.max(2, Math.round(w * 0.004))}px`; } catch { /* older canvas */ }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(sub, w / 2, band.y + bandH * 0.86);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}
