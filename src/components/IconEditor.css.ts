import { style } from "@vanilla-extract/css";
import { colors, scale } from "../theme.css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
});

export const canvas = style({
  border: `${scale.borderWidth} solid ${colors.borderInput}`,
  imageRendering: "pixelated",
  cursor: "crosshair",
});
