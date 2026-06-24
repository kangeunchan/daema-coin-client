import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const layoutVariants = cva("", {
  defaultVariants: {
    align: "stretch",
    gap: "4",
    justify: "start",
    wrap: false,
  },
  variants: {
    align: {
      center: "daema-ui-layout--align-center",
      end: "daema-ui-layout--align-end",
      start: "daema-ui-layout--align-start",
      stretch: "daema-ui-layout--align-stretch",
    },
    gap: {
      "0": "daema-ui-layout--gap-0",
      "1": "daema-ui-layout--gap-1",
      "2": "daema-ui-layout--gap-2",
      "3": "daema-ui-layout--gap-3",
      "4": "daema-ui-layout--gap-4",
      "5": "daema-ui-layout--gap-5",
      "6": "daema-ui-layout--gap-6",
    },
    justify: {
      between: "daema-ui-layout--justify-between",
      center: "daema-ui-layout--justify-center",
      end: "daema-ui-layout--justify-end",
      start: "daema-ui-layout--justify-start",
    },
    wrap: {
      false: null,
      true: "daema-ui-layout--wrap",
    },
  },
});

type LayoutOwnProps = VariantProps<typeof layoutVariants> & {
  asChild?: boolean;
};

export type StackProps = React.HTMLAttributes<HTMLDivElement> & LayoutOwnProps;
export type InlineProps = React.HTMLAttributes<HTMLDivElement> & LayoutOwnProps;

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ align, asChild = false, className, gap, justify, wrap, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn("daema-ui-stack", layoutVariants({ align, gap, justify, wrap }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Stack.displayName = "Stack";

export const Inline = React.forwardRef<HTMLDivElement, InlineProps>(
  ({ align, asChild = false, className, gap, justify, wrap, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn("daema-ui-inline", layoutVariants({ align, gap, justify, wrap }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Inline.displayName = "Inline";
