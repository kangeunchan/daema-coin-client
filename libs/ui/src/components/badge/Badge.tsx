import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { badgeVariants } from "./badgeVariants";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ asChild = false, className, intent, size, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";

    return <Comp className={cn(badgeVariants({ intent, size }), className)} ref={ref} {...props} />;
  },
);

Badge.displayName = "Badge";
