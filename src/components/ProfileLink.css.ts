import { style } from "@vanilla-extract/css";
import { colors, scale } from "../theme.css";

export const profileLink = style({
  color: colors.textDim,
  border: `${scale.borderWidth} solid transparent`,
  textDecoration: "none",
  display: "block",
  // ":hover": { color: colors.textBright },
});

export const profileLinkActive = style({
  color: colors.textBright,
  background: colors.panel,
  borderColor: colors.textDim,
});

// Fixed box so the avatar landing after the Firestore read doesn't reflow the
// header; an empty profile renders a transparent 16px canvas into it.
export const profileIcon = style({
  display: "flex",
  width: 32,
  height: 32,
  imageRendering: "pixelated",
});
