import { cva } from "class-variance-authority";

export const badgeVariants = cva("daema-ui-badge", {
  defaultVariants: {
    intent: "neutral",
    size: "md",
  },
  variants: {
    intent: {
      brand: "daema-ui-badge--intent-brand",
      danger: "daema-ui-badge--intent-danger",
      neutral: "daema-ui-badge--intent-neutral",
      success: "daema-ui-badge--intent-success",
      warning: "daema-ui-badge--intent-warning",
    },
    size: {
      sm: "daema-ui-badge--size-sm",
      md: "daema-ui-badge--size-md",
    },
  },
});
