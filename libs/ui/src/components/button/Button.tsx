import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";
import { buttonVariants } from "./buttonVariants";

export type ButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    disabled?: boolean;
    leadingIcon?: React.ReactNode;
    loading?: boolean;
    loadingLabel?: string;
    trailingIcon?: React.ReactNode;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      children,
      className,
      disabled = false,
      intent,
      leadingIcon,
      loading = false,
      loadingLabel = "Loading",
      size,
      trailingIcon,
      type,
      width,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        aria-busy={loading || undefined}
        aria-disabled={asChild && isDisabled ? true : undefined}
        className={cn(buttonVariants({ intent, size, width }), className)}
        data-loading={loading ? "" : undefined}
        disabled={!asChild ? isDisabled : undefined}
        ref={ref}
        type={!asChild ? (type ?? "button") : type}
        {...props}
      >
        {loading ? (
          <span aria-hidden="true" className="daema-ui-button__spinner" />
        ) : leadingIcon ? (
          <span aria-hidden="true" className="daema-ui-button__icon">
            {leadingIcon}
          </span>
        ) : null}
        {loading ? <span className="daema-ui-sr-only">{loadingLabel}</span> : null}
        <Slottable>{children}</Slottable>
        {trailingIcon ? (
          <span aria-hidden="true" className="daema-ui-button__icon">
            {trailingIcon}
          </span>
        ) : null}
      </Comp>
    );
  },
);

Button.displayName = "Button";
