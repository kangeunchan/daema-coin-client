import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { textVariants } from "./textVariants";

export type TextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "strong" | "small" | "h1" | "h2" | "h3";
    asChild?: boolean;
  };

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    { align, as: Element = "p", asChild = false, className, color, variant, weight, ...props },
    ref,
  ) => {
    const Comp = (asChild ? Slot : Element) as React.ElementType;
    return (
      <Comp
        className={cn(textVariants({ align, color, variant, weight }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);

Text.displayName = "Text";
