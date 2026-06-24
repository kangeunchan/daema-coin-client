import { useEffect, useState } from "react";
import { BellIcon, MagnifyingGlassIcon, ShoppingBagIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@daema/ui/icon-button";

type AppHeaderProps = {
  action?: "notifications" | "cart";
  stickyActions?: boolean;
};

export function AppHeader({ action = "notifications", stickyActions = false }: AppHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const ActionIcon = action === "cart" ? ShoppingBagIcon : BellIcon;

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
      <a aria-label="Daema home" className="customer-brand" href="/">
        <span>daema</span>
        <span className="customer-brand__dot">.</span>
      </a>

      <div className="customer-header__actions">
        <IconButton
          aria-label="Search"
          className="customer-header__button"
          intent="ghost"
          type="button"
        >
          <MagnifyingGlassIcon aria-hidden="true" />
        </IconButton>
        <IconButton
          aria-label={action === "cart" ? "Cart" : "Notifications"}
          className="customer-header__button"
          intent="ghost"
          type="button"
        >
          <ActionIcon aria-hidden="true" />
        </IconButton>
      </div>
    </header>
  );
}
