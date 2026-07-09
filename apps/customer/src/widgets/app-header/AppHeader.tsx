import { useEffect, useState } from "react";
import {
  BellIcon,
  MagnifyingGlassIcon,
  ReceiptPercentIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/solid";
import { IconButton } from "@daema/ui/icon-button";

import { pushCustomerPath } from "../../shared/lib/customerNavigation";

type AppHeaderProps = {
  action?: "notifications" | "cart";
  stickyActions?: boolean;
};

type HeaderActionButtonProps = {
  icon: typeof BellIcon;
  label: string;
  onClick?: (() => void) | undefined;
};

export function CustomerBrandLink() {
  return (
    <a aria-label="Daema home" className="customer-brand" href="/">
      <span>daema</span>
      <span className="customer-brand__dot">.</span>
    </a>
  );
}

export function HeaderActionButton({ icon: Icon, label, onClick }: HeaderActionButtonProps) {
  return (
    <IconButton
      aria-label={label}
      className="customer-header__button"
      intent="ghost"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" />
    </IconButton>
  );
}

export function HeaderActions({ action = "notifications" }: Pick<AppHeaderProps, "action">) {
  const ActionIcon = action === "cart" ? ShoppingBagIcon : BellIcon;

  return (
    <div className="customer-header__actions">
      <HeaderActionButton icon={MagnifyingGlassIcon} label="Search" />
      <HeaderActionButton
        icon={ActionIcon}
        label={action === "cart" ? "Cart" : "Notifications"}
        onClick={action === "cart" ? () => pushCustomerPath("/booth/cart") : undefined}
      />
      {action === "cart" ? (
        <HeaderActionButton
          icon={ReceiptPercentIcon}
          label="Order history"
          onClick={() => pushCustomerPath("/booth/orders")}
        />
      ) : null}
    </div>
  );
}

export function AppHeader({ action = "notifications", stickyActions = false }: AppHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    if (!stickyActions) {
      return;
    }

    const updateScrolledState = () => {
      setHasScrolled(window.scrollY > 12);
    };

    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateScrolledState);
    };
  }, [stickyActions]);

  return (
    <header
      className="customer-header"
      data-scrolled={hasScrolled ? "true" : undefined}
      data-sticky-actions={stickyActions ? "true" : undefined}
    >
      <CustomerBrandLink />
      <HeaderActions action={action} />
    </header>
  );
}
