import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const hero = style({
  display: 'flex',
  gap: 24,
  alignItems: 'flex-start',
  marginBottom: 32,
})

export const heroCover = style({
  width: 120,
  height: 120,
  background: colors.bg,
  border: `4px solid ${colors.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

export const heroInfo = style({ flex: 1 })

export const heroTitle = style({
  margin: "0 0 4px",
  color: colors.textBright,
  fontSize: 20,
});

export const heroMeta = style({
  color: colors.textDim,
  fontSize: 20,
  marginBottom: 20,
});

export const description = style({
  color: colors.text,
  fontSize: 20,
  marginBottom: 20,
});

export const heroActions = style({ display: 'flex', gap: 8 })

export const listHeading = style({
  color: colors.text,
  fontSize: 20,
  textTransform: "uppercase",
  margin: "0 0 12px",
});

export const itemMissing = style({
  flex: 1,
  color: colors.textFaint,
  fontSize: 20,
  fontStyle: "italic",
});
