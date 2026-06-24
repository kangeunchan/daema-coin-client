import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { surfaceVariants } from "./surfaceVariants";

export type SurfaceProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & {
    asChild?: boolean;
  };

export const Surface = React.forwardRef<HTMLElement, SurfaceProps>(
  ({ asChild = false, className, padding, tone, ...props }, ref) => {
    const Comp = asChild ? Slot : "section";

    return (
      <Comp className={cn(surfaceVariants({ padding, tone }), className)} ref={ref} {...props} />
    );
  },
);

Surface.displayName = "Surface";
