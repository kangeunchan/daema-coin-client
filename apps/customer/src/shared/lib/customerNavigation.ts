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

  if (window.location.pathname !== pathname) {
    window.history.pushState(navigationState, "", pathname);
  }

  window.dispatchEvent(
    typeof PopStateEvent === "function"
      ? new PopStateEvent("popstate", { state: navigationState })
      : new Event("popstate"),
  );
}
