import { style } from '@vanilla-extract/css'
import { colors, scale, sizes } from "../theme.css";

export const headerBar = style({
  backgroundColor: "#242424",
  borderBottom: `solid ${scale.borderWidth} ${colors.border}`,
});

export const header = style({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px 24px",
  maxWidth: sizes.maxWidth,
  margin: "0 auto",
});

export const title = style({
  color: colors.textBright,
  textAlign: "center",
  lineHeight: 1,
});

export const logoLink = style({
  display: "block",
  borderBottom: `${scale.borderWidth} solid transparent`,
});

export const logoLinkActive = style({
  borderBottomColor: "#2a5b59", // matches btnSecondary's border (theme.css.ts)
});

export const actions = style({
  display: "flex",
  gap: 8,
  alignItems: "center",
  minHeight: 28, // holds header height steady before identity resolves
});

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

