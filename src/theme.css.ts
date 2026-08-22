import {
  globalStyle,
  style,
  createGlobalTheme,
  assignVars,
} from "@vanilla-extract/css";

// The two levers for mobile scaling: shrink both together under the
// breakpoint so border weight stays proportional to text size instead of
// looking chunky next to smaller type.
export const scale = createGlobalTheme(":root", {
  fontSize: "24px",
  borderWidth: "4px",
});

globalStyle(":root", {
  "@media": {
    "screen and (max-width: 599px)": {
      vars: assignVars(scale, { fontSize: "12px", borderWidth: "2px" }),
    },
  },
});

// Terminal/ANSI palette — sampled from the canvas `chrome` (game/term/glyphs.ts)
// so the DOM website reads as the same high-contrast character-grid surface as
// the in-game canvas. Shared with `canvasPage.css.ts` via the same values.
export const colors = {
  bg: "#0d0d0d",
  textInverse: "#000",
  panel: "#121212",
  text: "#cccccc",
  textBright: "#ffffff",
  textDim: "#888888",
  textFaint: "#555555",
  border: "#333333",
  borderHover: "#666",
  borderInput: "#4d4d4d",
  link: "#00d9d9", // cyan — matches puzzle-name text in the canvas
  linkHover: "#5efaff",
  accent: "#00d9d9",
  green: "#40c83b", // title/action accent
  greenHover: "#86ed65",
  danger: "#f94848",
  dangerHover: "#f98f7a",
};

export const fonts = {
  default: '"Tiny5", sans-serif',
  // TODO add contensed
};

globalStyle("*, *::before, *::after", { boxSizing: "border-box" });

globalStyle("*::selection", {
  background: colors.linkHover,
  color: colors.textInverse,
});

globalStyle("html", {
  backgroundColor: colors.bg,
  minHeight: "100%",
});

globalStyle("body", {
  margin: 0,
  fontSize: scale.fontSize,
  lineHeight: 1.4,
  color: colors.text,
  fontFamily: fonts.default,
  fontWeight: 400,
  fontStyle: "normal",
});

globalStyle("a", { color: colors.link, textDecoration: "none" });
globalStyle("a:hover", { color: colors.linkHover });
globalStyle("a:focus-visible", {
  outline: `${scale.borderWidth} solid ${colors.linkHover}`,
  outlineOffset: 4,
});

globalStyle("button, input, select, textarea", {
  fontFamily: "inherit",
  fontSize: "100%",
});

globalStyle('input[type="text"], input[type="number"], textarea, select', {
  borderRadius: 0,
  border: `${scale.borderWidth} solid ${colors.borderInput}`,
  padding: "0 4px",
  background: colors.bg,
  color: colors.textBright,
});

globalStyle("button", {
  padding: "0px 8px",
  borderRadius: 0,
  border: 0,
  background: colors.link,
  color: colors.textInverse,
  fontFamily: "inherit",
  lineHeight: 1.4,
  textDecoration: "none",
  cursor: "pointer",
  verticalAlign: "text-bottom",
});
globalStyle("button:hover", {
  background: colors.linkHover,
  color: colors.textInverse,
  borderColor: colors.text,
});
globalStyle("button:disabled", { opacity: 0.5, cursor: "default" });

globalStyle(
  "input:focus-visible, textarea:focus-visible, select:focus-visible, button:focus-visible",
  {
    outline: `${scale.borderWidth} solid ${colors.linkHover}`,
    outlineOffset: 4,
  },
);

globalStyle(".deem", {
  color: colors.textDim,
});

globalStyle("h1,h2,h3,h4", {
  fontSize: "inherit",
  margin: 0,
});

globalStyle("h1, h2", {
  color: colors.textBright,
});

export const btn = style({
  padding: "0px 8px",
  borderRadius: 0,
  border: 0,
  background: colors.link,
  color: colors.textInverse,
  fontFamily: "inherit",
  lineHeight: 1.4,
  textDecoration: "none",
  cursor: "pointer",
  verticalAlign: "text-bottom",
  ":hover": {
    background: colors.linkHover,
    color: colors.textInverse,
    borderColor: colors.text,
  },
  selectors: {
    "&:disabled": { opacity: 0.5, cursor: "default" },
  },
});

// Primary/affirmative action — green-on-dark, matching the canvas action accent.
export const btnPrimary = style({
  background: colors.green,
  ":hover": {
    background: colors.greenHover,
  },
});

export const btnDanger = style({
  background: colors.danger,
  ":hover": {
    background: colors.dangerHover,
  },
});

export const btnSecondary = style({
  background: colors.bg,
  border: `${scale.borderWidth} solid #2a5b59`,
  color: "#389f9b",
  ":hover": {
    background: colors.bg,
    color: colors.linkHover,
    borderColor: colors.linkHover,
  },
});

export const empty = style({
  color: colors.textFaint,
  fontStyle: "italic",
});

export const page = style({
  padding: "0",
});

export const pageBody = style({
  padding: "24px",
});

globalStyle(".display_contents", {
  display: "contents",
});
