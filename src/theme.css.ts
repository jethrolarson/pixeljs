import { globalStyle, style } from '@vanilla-extract/css'

// Terminal/ANSI palette — sampled from the canvas `chrome` (game/term/glyphs.ts)
// so the DOM website reads as the same high-contrast character-grid surface as
// the in-game canvas. Shared with `canvasPage.css.ts` via the same values.
export const colors = {
  bg: "#0d0d0d",
  textInverse: "#000",
  panel: "#121212",
  panelHover: "#1a1a1a",
  text: "#cccccc",
  textBright: "#ffffff",
  textDim: "#888888",
  textFaint: "#555555",
  border: "#333333",
  borderInput: "#4d4d4d",
  link: "#00d9d9", // cyan — matches puzzle-name text in the canvas
  linkHover: "#7af6f6",
  accent: "#00d9d9",
  green: "#59b200", // title/action accent
  greenHover: "#7ad400",
  danger: "#f94848",
  dangerHover: "#f98f7a",
};

// Monospace stack — the single source of truth for the website chrome, mirrored
// from the canvas FONT_STACK.
export const mono = 'Menlo, Monaco, Consolas, "DejaVu Sans Mono", monospace'

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })

globalStyle("html", {
  backgroundColor: colors.bg,
  minHeight: "100%",
});

globalStyle("body", {
  margin: 0,
  fontSize: 20,
  lineHeight: 1.4,
  color: colors.text,
  fontFamily: '"Tiny5", sans-serif',
  fontWeight: 400,
  fontStyle: "normal",
});

globalStyle('a', { color: colors.link, textDecoration: 'none' })
globalStyle('a:hover', { color: colors.linkHover })

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit',
  fontSize: '100%',
})

globalStyle('input[type="text"], input[type="number"], textarea, select', {
  borderRadius: 0,
  border: `4px solid ${colors.borderInput}`,
  padding: "4px 8px",
  background: colors.bg,
  color: colors.textBright,
});

globalStyle('input:focus, textarea:focus, select:focus', {
  outline: 'none',
  borderColor: colors.accent,
})

export const btn = style({
  display: "inline-block",
  padding: "5px 12px",
  borderRadius: 0,
  border: 0,
  background: colors.link,
  color: colors.textInverse,
  fontFamily: "inherit",
  fontSize: 20,
  lineHeight: 1.4,
  textDecoration: "none",
  cursor: "pointer",
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

export const empty = style({
  color: colors.textFaint,
  fontStyle: 'italic',
})

export const page = style({
  padding: '0 24px 40px',
})

export const headerBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 0",
  borderBottom: `4px solid ${colors.border}`,
  marginBottom: 24,
});
