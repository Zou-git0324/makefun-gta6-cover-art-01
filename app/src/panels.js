// Panel layouts for Vice Cover Studio. Each layout is a list of panel rects as
// fractions of the art area (the canvas minus the title band), so one layout works
// at 1080 x 1080, 1080 x 1350 and 1920 x 1080 alike.

/** Layouts by name: every rect is { x, y, w, h } in fractions of the art area. */
export const LAYOUTS = {
  poster: [
    { x: 0, y: 0, w: 1, h: 0.62 },
    { x: 0, y: 0.62, w: 0.5, h: 0.38 },
    { x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
  ],
  trio: [
    { x: 0, y: 0, w: 0.34, h: 1 },
    { x: 0.34, y: 0, w: 0.32, h: 1 },
    { x: 0.66, y: 0, w: 0.34, h: 1 },
  ],
  duo: [
    { x: 0, y: 0, w: 0.56, h: 1 },
    { x: 0.56, y: 0, w: 0.44, h: 0.5 },
    { x: 0.56, y: 0.5, w: 0.44, h: 0.5 },
  ],
  quad: [
    { x: 0, y: 0, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
  ],
};

/** Panel count of a layout, for building the editor's panel picker. */
export function layoutPanelCount(layout) {
  return (LAYOUTS[layout] || LAYOUTS.poster).length;
}

/**
 * Pixel rects for a layout inside an art area of w x artH, inset by `gutter`
 * pixels between panels and around the edge.
 */
export function panelRects(layout, w, artH, gutter) {
  const defs = LAYOUTS[layout] || LAYOUTS.poster;
  return defs.map((d) => ({
    x: Math.round(d.x * w + gutter),
    y: Math.round(d.y * artH + gutter),
    w: Math.round(d.w * w - gutter * 2),
    h: Math.round(d.h * artH - gutter * 2),
  }));
}

/** A fresh panel: no photo yet, full frame, centred. */
export function blankPanel() {
  return { img: null, zoom: 1, dx: 0, dy: 0 };
}
