import { style } from "@vanilla-extract/css";
import { colors } from "../theme.css";

export const wrap = style({
  display: "flex",
  flexDirection: "column",
  gap: 8,
  alignItems: "flex-start",
});

export const canvas = style({
  border: `4px solid ${colors.borderInput}`,
  imageRendering: "pixelated",
  cursor: "crosshair",
});
