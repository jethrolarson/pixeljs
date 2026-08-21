import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const sectionTitle = style({
  fontSize: 20,
  color: colors.textBright,
  margin: "24px 0 12px",
});

export const row = style({
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: colors.panel,
  border: `4px solid ${colors.border}`,
  padding: "8px 12px",
  marginBottom: 6,
});

export const cover = style({
  width: 40,
  height: 40,
  background: colors.bg,
  border: `4px solid ${colors.border}`,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const titleBox = style({ flex: 1, minWidth: 0 })

export const titleLink = style({
  color: colors.text,
  textDecoration: "none",
  fontSize: 20,
  fontWeight: "bold",
  ":hover": { color: colors.textBright },
});

export const sub = style({ color: colors.textDim, fontSize: 11 })

export const controls = style({ display: 'flex', alignItems: 'center', gap: 10 })

export const ctrlLabel = style({
  fontSize: 20,
  color: colors.text,
  display: "flex",
  alignItems: "center",
  gap: 4,
  cursor: "pointer",
});

export const orderInput = style({ width: '3.5em' })
