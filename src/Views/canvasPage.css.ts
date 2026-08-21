import { globalStyle, style } from "@vanilla-extract/css";
import { term } from "../common/inputBase";

// Canvas pages fill the viewport with no scroll.
globalStyle("html, body", { overflow: "hidden", height: "100%", margin: 0 });
globalStyle("#root", { height: "100%" });

export const canvas = style({ display: "block", background: term.bg });

// Positions the DOM Palette (a plain in-flow panel by itself) as a floating
// overlay in the corner of the fullscreen canvas — canvas-page-specific, so
// it lives here rather than in Palette's own stylesheet.
export const paletteOverlay = style({ position: "fixed", left: 8, bottom: 8 });

export const menu = style({
  position: "fixed",
  left: 8,
  top: 8,
  padding: "8px 10px",
  width: 176,
  background: term.panel,
  border: `4px solid ${term.dim}`,
  fontFamily: "inherit",

  color: term.text,
});

export const backLink = style({
  display: "block",
  fontFamily: "inherit",
  color: term.name,
  textDecoration: "none",
  marginBottom: 8,
  selectors: { "&:hover": { color: "#aef6f6" } },
});

export const field = style({ padding: "4px 0" });

// Terminal-styled form controls for the editor chrome.
export const termInput = style({
  fontFamily: "inherit",
  background: term.bg,
  color: term.text,
  border: `4px solid ${term.dim}`,
  borderRadius: 0,
  padding: "3px 6px",
  selectors: {
    "&:focus-visible": { outline: "none", borderColor: term.accent },
  },
});

export const termLabel = style({
  fontFamily: "inherit",
  color: term.dim,
});

export const termBtn = style({
  fontFamily: "inherit",
  display: "inline-block",
  background: term.bg,
  color: term.green,
  border: `4px solid ${term.green}`,
  borderRadius: 0,
  padding: "3px 10px",
  cursor: "pointer",
  textDecoration: "none",
  selectors: { "&:hover": { background: "#16240a", color: "#7ad400" } },
});
