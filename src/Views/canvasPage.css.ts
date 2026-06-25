import { globalStyle, style } from '@vanilla-extract/css'
import { mono } from '../theme.css'

export { mono }

// Canvas pages fill the viewport with no scroll.
globalStyle('html, body', { overflow: 'hidden', height: '100%', margin: 0 })
globalStyle('#root', { height: '100%' })

// Terminal/ANSI chrome palette — mirrors `game/term/glyphs.ts` `chrome` so the
// DOM menu reads as part of the same character-grid surface.
export const term = {
  bg: '#0d0d0d',
  panel: '#121212',
  dim: '#4d4d4d',
  text: '#cccccc',
  name: '#00d9d9',
  green: '#59b200',
  accent: '#00d9d9',
} as const

export const canvas = style({ display: 'block', background: term.bg })

export const menu = style({
  position: 'fixed',
  left: 8,
  top: 8,
  padding: '8px 10px',
  width: 160,
  background: term.panel,
  border: `1px solid ${term.dim}`,
  fontFamily: mono,
  fontSize: 13,
  color: term.text,
})

export const backLink = style({
  display: 'block',
  fontFamily: mono,
  color: term.name,
  textDecoration: 'none',
  marginBottom: 8,
  selectors: { '&:hover': { color: '#aef6f6' } },
})

export const field = style({ padding: '4px 0' })

// Terminal-styled form controls for the editor chrome.
export const termInput = style({
  fontFamily: mono,
  background: term.bg,
  color: term.text,
  border: `1px solid ${term.dim}`,
  borderRadius: 0,
  padding: '3px 6px',
  selectors: { '&:focus': { outline: 'none', borderColor: term.accent } },
})

export const termLabel = style({ fontFamily: mono, color: term.dim, fontSize: 12 })

export const termBtn = style({
  fontFamily: mono,
  display: 'inline-block',
  background: term.bg,
  color: term.green,
  border: `1px solid ${term.green}`,
  borderRadius: 0,
  padding: '3px 10px',
  cursor: 'pointer',
  textDecoration: 'none',
  selectors: { '&:hover': { background: '#16240a', color: '#7ad400' } },
})
