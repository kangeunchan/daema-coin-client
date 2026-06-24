import {
  cssVarNames,
  cssVars,
  lightTokens,
  tokenNames,
  tokensByTheme,
  tokenVar,
  themeNames,
} from "./generated/tokens";
import type { CssVarName, ThemeName, TokenName } from "./generated/tokens";

export { cssVarNames, cssVars, lightTokens, tokenNames, tokensByTheme, tokenVar, themeNames };

export type { CssVarName, ThemeName, TokenName };

export const colors = {
  canvas: lightTokens.color.background.canvas,
  surface: lightTokens.color.background.surface,
  surfaceMuted: lightTokens.color.background.surfaceMuted,
  border: lightTokens.color.border.default,
  text: lightTokens.color.foreground.default,
  textMuted: lightTokens.color.foreground.muted,
  primary: lightTokens.color.action.primary,
  primaryStrong: lightTokens.color.action.primaryHover,
  primarySoft: lightTokens.color.background.brandSoft,
  accent: lightTokens.color.accent.default,
  accentSoft: lightTokens.color.accent.soft,
  success: lightTokens.color.status.success.foreground,
  successSoft: lightTokens.color.status.success.background,
  warning: lightTokens.color.status.warning.foreground,
  warningSoft: lightTokens.color.status.warning.background,
  danger: lightTokens.color.status.danger.foreground,
  dangerSoft: lightTokens.color.status.danger.background,
  info: lightTokens.color.status.info.foreground,
  infoSoft: lightTokens.color.status.info.background,
} as const;

export const spacing = lightTokens.space;
export const radii = lightTokens.radius;
export const shadows = lightTokens.shadow;

export const typography = {
  sans: lightTokens.font.family.sans,
  display: lightTokens.font.family.display,
  mono: lightTokens.font.family.mono,
  size: lightTokens.font.size,
  lineHeight: lightTokens.line.height,
  weight: lightTokens.font.weight,
} as const;

export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type RadiusToken = keyof typeof radii;
