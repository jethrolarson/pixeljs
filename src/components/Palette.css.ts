import { style } from '@vanilla-extract/css'

export const layers = style({
  position: 'fixed',
  left: 0,
  bottom: 0,
  padding: '10px 5px',
  whiteSpace: 'nowrap',
})

export const swatch = style({
  margin: '0 0 1px',
  width: 22,
  height: 22,
  display: 'inline-block',
  textDecoration: 'none',
  cursor: 'pointer',
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
})

export const on = style({
  outline: '2px solid yellow',
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
  width: 22,
  height: 22,
  lineHeight: '20px',
  padding: 0,
  marginLeft: 2,
  verticalAlign: 'top',
})
