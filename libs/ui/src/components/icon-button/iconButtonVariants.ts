import { cva } from "class-variance-authority";

export const iconButtonVariants = cva("daema-ui-icon-button", {
  defaultVariants: {
    intent: "ghost",
    size: "md",
  },
  variants: {
    intent: {
      danger: "daema-ui-icon-button--intent-danger",
      ghost: "daema-ui-icon-button--intent-ghost",
      primary: "daema-ui-icon-button--intent-primary",
      secondary: "daema-ui-icon-button--intent-secondary",
    },
    size: {
      lg: "daema-ui-icon-button--size-lg",
      md: "daema-ui-icon-button--size-md",
      sm: "daema-ui-icon-button--size-sm",
    },
  },
});
