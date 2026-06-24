import { cva } from "class-variance-authority";

export const buttonVariants = cva("daema-ui-button", {
  defaultVariants: {
    intent: "primary",
    size: "md",
    width: "auto",
  },
  variants: {
    intent: {
      danger: "daema-ui-button--intent-danger",
      ghost: "daema-ui-button--intent-ghost",
      primary: "daema-ui-button--intent-primary",
      secondary: "daema-ui-button--intent-secondary",
    },
    size: {
      lg: "daema-ui-button--size-lg",
      md: "daema-ui-button--size-md",
      sm: "daema-ui-button--size-sm",
    },
    width: {
      auto: null,
      full: "daema-ui-button--width-full",
    },
  },
});
