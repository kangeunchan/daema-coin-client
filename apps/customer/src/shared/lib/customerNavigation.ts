import type { MouseEvent } from "react";

export function getCurrentCustomerPathname() {
  return window.location.pathname;
}

export function getCustomerNavigationState(pathname: string) {
  if (pathname === "/login") {
    return { customerPageId: "login" };
  }

  if (pathname === "/booth" || pathname.startsWith("/booth/")) {
    return { customerPageId: "map" };
  }

  if (pathname === "/history") {
    return { customerPageId: "history" };
  }

  if (pathname === "/points/worldcup" || pathname.startsWith("/points/worldcup/")) {
    return { customerPageId: "points", customerPointTabId: "worldcup" };
  }

  if (pathname === "/points" || pathname.startsWith("/points/")) {
    return { customerPageId: "points", customerPointTabId: "daily" };
  }

  if (pathname === "/pay") {
    return { customerPageId: "pay" };
  }

  if (pathname === "/all") {
    return { customerPageId: "all" };
  }

  return { customerPageId: "home" };
}

export function pushCustomerPath(pathname: string) {
  const navigationState = getCustomerNavigationState(pathname);

  if (getCurrentCustomerPathname() !== pathname) {
    window.history.pushState(navigationState, "", pathname);
  }

  window.dispatchEvent(
    typeof PopStateEvent === "function"
      ? new PopStateEvent("popstate", { state: navigationState })
      : new Event("popstate"),
  );
}

export function shouldHandleCustomerNavigationClick(event: MouseEvent<HTMLElement>) {
  const target = event.currentTarget.getAttribute("target");

  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!target || target === "_self")
  );
}

export function navigateCustomerPathFromClick(
  event: MouseEvent<HTMLElement>,
  pathname: string,
) {
  if (!shouldHandleCustomerNavigationClick(event)) {
    return false;
  }

  event.preventDefault();
  pushCustomerPath(pathname);

  return true;
}
