import { cva } from "class-variance-authority";

export const dividerVariants = cva("daema-ui-divider", {
  defaultVariants: {
    orientation: "horizontal",
  },
  variants: {
    orientation: {
      horizontal: "daema-ui-divider--horizontal",
      vertical: "daema-ui-divider--vertical",
    },
  },
});
