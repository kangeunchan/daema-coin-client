import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const cardVariants = cva("daema-ui-card", {
  defaultVariants: {
    padding: "md",
    tone: "default",
  },
  variants: {
    padding: {
      lg: "daema-ui-card--padding-lg",
      md: "daema-ui-card--padding-md",
      none: "daema-ui-card--padding-none",
      sm: "daema-ui-card--padding-sm",
    },
    tone: {
      default: "daema-ui-card--tone-default",
      glass: "daema-ui-card--tone-glass",
      muted: "daema-ui-card--tone-muted",
    },
  },
});

type DivPrimitiveProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
};

export type CardProps = DivPrimitiveProps & VariantProps<typeof cardVariants>;
export type CardHeaderProps = DivPrimitiveProps;
export type CardContentProps = DivPrimitiveProps;
export type CardFooterProps = DivPrimitiveProps;
export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  asChild?: boolean;
};
export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement> & {
  asChild?: boolean;
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ asChild = false, className, padding, tone, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp className={cn(cardVariants({ padding, tone }), className)} ref={ref} {...props} />;
  },
);

Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp className={cn("daema-ui-card__header", className)} ref={ref} {...props} />;
  },
);

CardHeader.displayName = "CardHeader";

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp className={cn("daema-ui-card__content", className)} ref={ref} {...props} />;
  },
);

CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return <Comp className={cn("daema-ui-card__footer", className)} ref={ref} {...props} />;
  },
);

CardFooter.displayName = "CardFooter";

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "h2";
    return <Comp className={cn("daema-ui-card__title", className)} ref={ref} {...props} />;
  },
);

CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return <Comp className={cn("daema-ui-card__description", className)} ref={ref} {...props} />;
  },
);

CardDescription.displayName = "CardDescription";
