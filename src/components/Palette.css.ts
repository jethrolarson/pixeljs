import { style } from '@vanilla-extract/css'
import { colors, mono } from "../theme.css";

// Deliberately not importing from canvasPage.css: that module's global
// overflow:hidden (meant for fullscreen canvas game pages) would leak onto
// any plain DOM page that uses Palette, like PackEdit's inline icon editor.
export const layers = style({
  padding: 6,
  background: colors.panel,
  border: `4px solid ${colors.borderInput}`,
  whiteSpace: "nowrap",
});

export const swatch = style({
  margin: "0 2px 0 0",
  width: 40,
  height: 40,
  display: "inline-block",
  textDecoration: "none",
  cursor: "pointer",
  border: `4px solid ${colors.borderInput}`,
  position: "relative",
  overflow: "visible",
  verticalAlign: "top",
});

export const on = style({
  borderColor: colors.accent,
  outlineOffset: -1,
});

// The color input is wrapped by the swatch <label>; hide it so the swatch
// itself is the visible target while clicking still opens the native picker.
export const hiddenColorInput = style({
  position: 'absolute',
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  opacity: 0,
})

// Small "×" overlaid on the top-right corner of an edit-mode swatch.
export const removeButton = style({
  position: "absolute",
  top: -4,
  right: -4,
  width: 16,
  height: 16,
  lineHeight: "10px",
  fontSize: 20,
  padding: 0,
  border: 0,
  fontFamily: "inherit",
  background: "#dc1d1d",
  color: "#000",
  textAlign: "center",
  borderRadius: 0,
  cursor: "pointer",
  zIndex: 1,
  paddingLeft: 2,
});

export const addButton = style({
  width: 40,
  height: 40,
  lineHeight: "22px",
  padding: 0,
  marginLeft: 4,
  verticalAlign: "top",
  fontFamily: "inherit",
  background: colors.bg,
  color: colors.green,
  border: `4px solid ${colors.green}`,
  borderRadius: 0,
  cursor: "pointer",
});
