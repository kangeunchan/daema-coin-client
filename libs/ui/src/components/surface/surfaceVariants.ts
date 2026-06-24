import { cva } from "class-variance-authority";

export const surfaceVariants = cva("daema-ui-surface", {
  defaultVariants: {
    padding: "md",
    tone: "default",
  },
  variants: {
    padding: {
      lg: "daema-ui-surface--padding-lg",
      md: "daema-ui-surface--padding-md",
      none: "daema-ui-surface--padding-none",
      sm: "daema-ui-surface--padding-sm",
    },
    tone: {
      default: "daema-ui-surface--tone-default",
      glass: "daema-ui-surface--tone-glass",
      muted: "daema-ui-surface--tone-muted",
    },
  },
});
