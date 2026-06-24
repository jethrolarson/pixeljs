import { style } from '@vanilla-extract/css'
import { term, mono } from '../Views/canvasPage.css'

export const layers = style({
  position: 'fixed',
  left: 8,
  bottom: 8,
  padding: 6,
  background: term.panel,
  border: `1px solid ${term.dim}`,
  whiteSpace: 'nowrap',
})

export const swatch = style({
  margin: '0 2px 0 0',
  width: 24,
  height: 24,
  display: 'inline-block',
  textDecoration: 'none',
  cursor: 'pointer',
  border: `1px solid ${term.dim}`,
  position: 'relative',
  overflow: 'hidden',
  verticalAlign: 'top',
})

export const on = style({
  outline: `2px solid ${term.accent}`,
  outlineOffset: -1,
})

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

export const addButton = style({
  width: 24,
  height: 24,
  lineHeight: '22px',
  padding: 0,
  marginLeft: 2,
  verticalAlign: 'top',
  fontFamily: mono,
  background: term.bg,
  color: term.green,
  border: `1px solid ${term.green}`,
  borderRadius: 0,
  cursor: 'pointer',
})
