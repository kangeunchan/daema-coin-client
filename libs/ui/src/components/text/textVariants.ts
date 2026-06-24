import { cva } from "class-variance-authority";

export const textVariants = cva("daema-ui-text", {
  defaultVariants: {
    align: "start",
    color: "default",
    variant: "body",
    weight: "regular",
  },
  variants: {
    align: {
      center: "daema-ui-text--align-center",
      end: "daema-ui-text--align-end",
      start: "daema-ui-text--align-start",
    },
    color: {
      brand: "daema-ui-text--color-brand",
      danger: "daema-ui-text--color-danger",
      default: null,
      muted: "daema-ui-text--color-muted",
      subtle: "daema-ui-text--color-subtle",
    },
    variant: {
      body: "daema-ui-text--variant-body",
      caption: "daema-ui-text--variant-caption",
      display: "daema-ui-text--variant-display",
      lead: "daema-ui-text--variant-lead",
      title: "daema-ui-text--variant-title",
    },
    weight: {
      bold: "daema-ui-text--weight-bold",
      medium: "daema-ui-text--weight-medium",
      regular: "daema-ui-text--weight-regular",
      semibold: "daema-ui-text--weight-semibold",
    },
  },
});
