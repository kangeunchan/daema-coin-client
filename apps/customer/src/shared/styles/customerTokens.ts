export const customerColor = {
  brand: "var(--daema-color-action-primary)",
  brandHover: "var(--daema-color-action-primary-hover)",
  brandSoft: "var(--daema-color-background-brand-soft)",
  canvas: "var(--daema-color-background-canvas)",
  canvasMuted: "#eeeef3",
  surface: "var(--daema-color-background-surface)",
  surfaceMuted: "var(--daema-color-background-surface-muted)",
  text: "var(--daema-color-foreground-default)",
  textMuted: "var(--daema-color-foreground-muted)",
  textSubtle: "var(--daema-color-foreground-subtle)",
  border: "var(--daema-color-border-default)",
} as const;

export const customerFont = {
  body: "var(--daema-font-family-sans)",
  display: "var(--daema-font-family-display)",
} as const;

export const customerLayout = {
  frameMaxWidth: "var(--daema-component-app-frame-max-width)",
  screenInset: 18,
  tabbarBottomOffset: 20,
} as const;

export const customerMotion = {
  fast: "var(--daema-duration-normal)",
  normal: "var(--daema-duration-slow)",
  ease: "var(--daema-ease-standard)",
} as const;
