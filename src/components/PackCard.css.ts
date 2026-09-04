import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const card = style({});

export const cover = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 128,
  height: 128,
  background: colors.bg,
  border: `8px solid ${colors.border}`,
  textDecoration: "none",
  ":hover": { borderColor: colors.borderHover },
  boxSizing: "content-box",
});

export const info = style({ padding: '8px 2px' })

export const titleLink = style({
  display: "block",
  color: colors.textBright,

  fontWeight: "bold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  marginBottom: 2,
  ":hover": { color: "#fff" },
});

export const meta = style({
  color: colors.textDim,
  marginBottom: 6,
});

export const cardActions = style({ display: 'flex', gap: 4 })

export const voted = style({
  color: "#c17606",
});

export const grid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
})
