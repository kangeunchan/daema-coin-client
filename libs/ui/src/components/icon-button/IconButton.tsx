import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { iconButtonVariants } from "./iconButtonVariants";

type AccessibleName =
  | {
      "aria-label": string;
      "aria-labelledby"?: never;
    }
  | {
      "aria-label"?: never;
      "aria-labelledby": string;
    };

export type IconButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> &
  VariantProps<typeof iconButtonVariants> &
  AccessibleName & {
    asChild?: boolean;
    children: React.ReactNode;
  };

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { asChild = false, children, className, disabled = false, intent, size, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        aria-disabled={asChild && disabled ? true : undefined}
        className={cn(iconButtonVariants({ intent, size }), className)}
        disabled={!asChild ? disabled : undefined}
        ref={ref}
        type={!asChild ? (type ?? "button") : type}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

IconButton.displayName = "IconButton";
