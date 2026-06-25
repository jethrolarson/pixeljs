import { globalStyle, style } from '@vanilla-extract/css'

// Terminal/ANSI palette — sampled from the canvas `chrome` (game/term/glyphs.ts)
// so the DOM website reads as the same high-contrast character-grid surface as
// the in-game canvas. Shared with `canvasPage.css.ts` via the same values.
export const colors = {
  bg: '#0d0d0d',
  panel: '#121212',
  panelHover: '#1a1a1a',
  text: '#cccccc',
  textBright: '#ffffff',
  textDim: '#888888',
  textFaint: '#555555',
  border: '#333333',
  borderInput: '#4d4d4d',
  link: '#00d9d9', // cyan — matches puzzle-name text in the canvas
  linkHover: '#7af6f6',
  accent: '#00d9d9',
  green: '#59b200', // title/action accent
  greenHover: '#7ad400',
  danger: '#ff5555',
}

// Monospace stack — the single source of truth for the website chrome, mirrored
// from the canvas FONT_STACK.
export const mono = 'Menlo, Monaco, Consolas, "DejaVu Sans Mono", monospace'

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })

globalStyle('html', {
  backgroundColor: colors.bg,
  minHeight: '100%',
})

globalStyle('body', {
  margin: 0,
  fontSize: 15,
  fontFamily: mono,
  lineHeight: 1.4,
  color: colors.text,
})

globalStyle('a', { color: colors.link, textDecoration: 'none' })
globalStyle('a:hover', { color: colors.linkHover })

globalStyle('button, input, select, textarea', {
  fontFamily: 'inherit',
  fontSize: '100%',
})

globalStyle('input[type="text"], input[type="number"], textarea, select', {
  borderRadius: 0,
  border: `1px solid ${colors.borderInput}`,
  padding: '4px 8px',
  background: colors.bg,
  color: colors.textBright,
})

globalStyle('input:focus, textarea:focus, select:focus', {
  outline: 'none',
  borderColor: colors.accent,
})

export const btn = style({
  display: 'inline-block',
  padding: '5px 12px',
  borderRadius: 0,
  border: `1px solid ${colors.borderInput}`,
  background: colors.panel,
  color: colors.text,
  fontFamily: mono,
  fontSize: 13,
  lineHeight: 1.4,
  textDecoration: 'none',
  cursor: 'pointer',
  ':hover': { background: colors.panelHover, color: colors.textBright, borderColor: colors.text },
  selectors: {
    '&:disabled': { opacity: 0.5, cursor: 'default' },
  },
})

// Primary/affirmative action — green-on-dark, matching the canvas action accent.
export const btnPrimary = style({
  color: colors.green,
  borderColor: colors.green,
  ':hover': { background: '#16240a', color: colors.greenHover, borderColor: colors.greenHover },
})

export const btnDanger = style({
  color: colors.danger,
  borderColor: colors.danger,
})

export const empty = style({
  color: colors.textFaint,
  fontStyle: 'italic',
})

export const page = style({
  padding: '0 24px 40px',
})

export const headerBar = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 0',
  borderBottom: `1px solid ${colors.border}`,
  marginBottom: 24,
})
