import { CellBuffer } from './cellbuffer'
import { chrome } from './glyphs'
import { TermMetrics } from './termrender'
import { GRID_PX, ZOOM_STEP, Viewport } from "../layout";

interface Line {
  s: string
  fg: string
}

// ASCII-only (plus the synthetic '·'); the bitmap font is 0x00–0x7F. Kept
// narrow (longest line ~24 cols, was ~39) so the panel stays readable in
// portrait on phones instead of forcing a tiny cell size to fit sideways.
const LINES: Line[] = [
  { s: "pp·wf guide", fg: chrome.green },
  { s: "", fg: chrome.text },
  { s: "MOUSE", fg: chrome.name },
  { s: "  swatch  color", fg: chrome.text },
  { s: "  cell    paint", fg: chrome.text },
  { s: "  r-click erase", fg: chrome.text },
  { s: "", fg: chrome.text },
  { s: "KEYBOARD", fg: chrome.name },
  { s: "  arrow   move", fg: chrome.text },
  { s: "  space   paint", fg: chrome.text },
  { s: "  backsp  clear", fg: chrome.text },
  { s: "  x       erase", fg: chrome.text },
  { s: "  tab     change color", fg: chrome.text },
  { s: "", fg: chrome.text },
  { s: "MENU", fg: chrome.name },
  { s: "  ~  puzzle list", fg: chrome.text },
  { s: "  <  previous level", fg: chrome.text },
  { s: "  >  next puzzle", fg: chrome.text },
  { s: "", fg: chrome.text },
  { s: "esc/? close", fg: chrome.dim },
];

/**
 * The help guide as a self-contained ANSI panel: its own opaque char buffer and
 * metrics, independent of the puzzle layout (the puzzle's cells can be huge, so
 * the modal sizes itself). The loop dims the screen and draws this over the top.
 */
export function projectHelp(viewport: Viewport): {
  buffer: CellBuffer;
  metrics: TermMetrics;
} {
  const innerW = LINES.reduce((m, l) => Math.max(m, l.s.length), 0);
  const cols = innerW + 4; // 1 border + 1 pad on each side
  const rows = LINES.length + 4; // 1 border + 1 pad, top and bottom

  // Fit the panel to the viewport, snapped to the same GRID_PX-based zoom step
  // the board uses (drawCell derives zoom as cellH / GRID_PX). The loop now
  // clears to an opaque background behind this rather than dimming the puzzle,
  // so the panel reads as its own full screen — cap matches the board's own
  // MAX_CELL instead of staying artificially small like a web dialog.
  let cell = Math.floor(
    Math.min((viewport.w * 0.98) / cols, (viewport.h * 0.98) / rows),
  );
  cell = Math.max(GRID_PX, Math.floor(cell / ZOOM_STEP) * ZOOM_STEP);
  cell = Math.min(cell, GRID_PX * 4);

  const buf = new CellBuffer(cols, rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++)
      buf.set(c, r, { glyph: " ", fg: chrome.text, bg: chrome.bg });
  }
  buf.box(0, 0, cols, rows, chrome.name, chrome.bg);
  LINES.forEach((l, i) => buf.text(2, 2 + i, l.s, l.fg, chrome.bg));

  return {
    buffer: buf,
    metrics: {
      cellW: cell,
      cellH: cell,
      originX: Math.floor((viewport.w - cols * cell) / 2),
      originY: Math.floor((viewport.h - rows * cell) / 2),
    },
  };
}
