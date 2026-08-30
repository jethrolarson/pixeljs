import { style } from "@vanilla-extract/css";
import { colors, scale } from "../theme.css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "center",
  width: "100%",
  height: "100%",
  minHeight: 0,
});

// Flexes to fill whatever the modal gives it; centers the canvas, which sizes
// itself via ResizeObserver (IconEditor.ts) rather than CSS aspect-ratio —
// the latter measured non-square on first paint on mobile (viewport/flex not
// settled yet), stretching the drawing. alignSelf: stretch is load-bearing —
// `wrap`'s alignItems: center otherwise sizes this to its content (the
// canvas), which is exactly what the canvas is sizing itself from: a fixed
// point at native/tiny size instead of ever growing to fill the modal.
export const canvasWrap = style({
  flex: "1 1 auto",
  alignSelf: "stretch",
  minWidth: 0,
  minHeight: 0,
  maxWidth: "100%",
  maxHeight: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const canvas = style({
  border: `${scale.borderWidth} solid ${colors.borderInput}`,
  imageRendering: "pixelated",
  cursor: "crosshair",
  touchAction: "none",
});
