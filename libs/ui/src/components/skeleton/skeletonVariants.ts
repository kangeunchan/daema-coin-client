import { cva } from "class-variance-authority";

export const skeletonVariants = cva("daema-ui-skeleton", {
  defaultVariants: {
    shape: "block",
  },
  variants: {
    shape: {
      block: "daema-ui-skeleton--shape-block",
      circle: "daema-ui-skeleton--shape-circle",
      text: "daema-ui-skeleton--shape-text",
    },
  },
});
