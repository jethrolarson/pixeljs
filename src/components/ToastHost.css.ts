import { style } from '@vanilla-extract/css'
import { colors } from "../theme.css";

export const host = style({
  position: 'fixed',
  right: 12,
  bottom: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  zIndex: 1000,
  pointerEvents: 'none',
})

export const toast = style({
  padding: "8px 12px",
  background: colors.panel,
  border: `4px solid ${colors.borderInput}`,
  color: colors.text,
  fontFamily: "inherit",
});

export const info = style({ borderColor: colors.green, color: colors.greenHover })

export const error = style({ borderColor: colors.danger, color: colors.danger })
