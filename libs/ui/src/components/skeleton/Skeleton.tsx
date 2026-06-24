import * as React from "react";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { skeletonVariants } from "./skeletonVariants";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants>;

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, ...props }, ref) => (
    <div
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      ref={ref}
      {...props}
    />
  ),
);

Skeleton.displayName = "Skeleton";
