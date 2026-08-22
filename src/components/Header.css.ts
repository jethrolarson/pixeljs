import { style } from '@vanilla-extract/css'
import { colors, scale } from '../theme.css'

export const headerBar = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 24px",
  backgroundColor: "#242424",
});

export const title = style({
  color: colors.textBright,
  textAlign: "center",
});

export const logoLink = style({
  display: "block",
  borderBottom: `${scale.borderWidth} solid transparent`,
});

export const logoLinkActive = style({
  borderBottomColor: "#2a5b59", // matches btnSecondary's border (theme.css.ts)
});

export const actions = style({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
})

export const hidden = style({
  display: 'none',
})

export const tab = style({
  padding: "4px 8px 0px",
  color: colors.textDim,
  borderBottom: `${scale.borderWidth} solid transparent`,
  textDecoration: "none",
  borderRadius: 0,

  ":hover": { color: colors.textBright },
});

export const tabActive = style({
  color: colors.textBright,
  background: colors.panel,
  borderBottomColor: colors.textDim,
});
