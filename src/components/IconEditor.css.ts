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

// Flexes to fill whatever the modal gives it, then caps itself to a square
// (aspect-ratio set inline per-level) so drawing and page scroll never fight
// over the same touch gesture the way a small fixed-size inline canvas did.
export const canvasWrap = style({
  flex: "1 1 auto",
  minHeight: 0,
  maxWidth: "100%",
  maxHeight: "100%",
  display: "flex",
});

export const canvas = style({
  border: `${scale.borderWidth} solid ${colors.borderInput}`,
  imageRendering: "pixelated",
  cursor: "crosshair",
  width: "100%",
  height: "100%",
  touchAction: "none",
});
