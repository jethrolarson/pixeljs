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

// A top bar rather than a side panel: on a narrow phone, screen width is the
// scarce resource and height is comparatively cheap (loop.ts measures this
// element's actual rendered height each frame, so wrapping onto more rows
// here just works — no fixed height to keep in sync).
export const menu = style({
  position: "fixed",
  left: 0,
  top: 0,
  right: 0,
  padding: "8px 12px",
  background: term.panel,
  borderBottom: `4px solid ${term.dim}`,
  fontFamily: "inherit",
  color: term.text,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
});

export const backLink = style({
  fontFamily: "inherit",
  color: term.name,
  textDecoration: "none",
  selectors: { "&:hover": { color: "#aef6f6" } },
});

export const field = style({ display: "flex", alignItems: "center", gap: 6 });

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
