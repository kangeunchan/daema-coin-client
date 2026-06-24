import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { dividerVariants } from "./dividerVariants";

export type DividerProps = React.HTMLAttributes<HTMLHRElement> &
  VariantProps<typeof dividerVariants>;

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ className, orientation = "horizontal", role, ...props }, ref) => (
    <hr
      aria-orientation={orientation === "vertical" ? "vertical" : undefined}
      className={cn(dividerVariants({ orientation }), className)}
      ref={ref}
      role={role ?? "separator"}
      {...props}
    />
  ),
);

Divider.displayName = "Divider";
