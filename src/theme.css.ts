import { globalStyle, style } from '@vanilla-extract/css'

export const colors = {
  bg: '#333',
  panel: '#222',
  panelHover: '#262626',
  text: '#aaa',
  textBright: '#eee',
  textDim: '#777',
  textFaint: '#666',
  border: '#444',
  borderInput: '#666',
  link: '#508ced',
  linkHover: '#75a4f0',
  accent: '#508ced',
  danger: '#e44',
}

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' })

globalStyle('html', {
  backgroundColor: colors.bg,
  minHeight: '100%',
})

globalStyle('body', {
  margin: 0,
  fontSize: 16,
  fontFamily: 'Arial, Helvetica, sans-serif',
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
  borderRadius: 4,
  border: `1px solid ${colors.borderInput}`,
  padding: '4px 8px',
  background: colors.panel,
  color: colors.textBright,
})

globalStyle('input:focus, textarea:focus, select:focus', {
  outline: 'none',
  borderColor: colors.accent,
})

export const btn = style({
  display: 'inline-block',
  padding: '5px 12px',
  borderRadius: 4,
  border: '1px solid #555',
  background: '#2a2a2a',
  color: '#ccc',
  fontSize: 13,
  lineHeight: 1.4,
  textDecoration: 'none',
  cursor: 'pointer',
  ':hover': { background: '#333', color: colors.textBright, borderColor: colors.textDim },
  selectors: {
    '&:disabled': { opacity: 0.5, cursor: 'default' },
  },
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
