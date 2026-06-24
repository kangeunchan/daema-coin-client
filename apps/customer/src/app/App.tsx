import { useEffect, useState } from "react";

import { navigationTabs } from "../entities/customer-home";
import type { NavigationTab } from "../entities/customer-home";
import { CustomerAllPage } from "../pages/all/CustomerAllPage";
import { CustomerHistoryPage } from "../pages/history/CustomerHistoryPage";
import { CustomerHomePage } from "../pages/home/CustomerHomePage";
import { CustomerLoginPage } from "../pages/login/CustomerLoginPage";
import { CustomerMapPage } from "../pages/map/CustomerMapPage";
import { CustomerPayPage } from "../pages/pay/CustomerPayPage";
import { CustomerPointsPage } from "../pages/points/CustomerPointsPage";
import { CustomerTabPage } from "../pages/tab/CustomerTabPage";
import {
  checkCustomerSession,
  completeGithubAuthentication,
  completeStudentProfile,
  hasStoredCustomerSession,
  isGithubLoginSuccessRedirect,
} from "../shared/api/auth";
import { isCustomerApiEnabled } from "../shared/api/client";
import { pushCustomerPath } from "../shared/lib/customerNavigation";
import { BottomTabbar } from "../widgets/bottom-tabbar";
import { CustomerAppShell } from "./ui/CustomerAppShell";

type CustomerPageId = NavigationTab["id"] | "history";
type CustomerPointTabId = "daily" | "worldcup";
type CustomerLoginStep = "github" | "profile";

function getPageIdFromPathname(pathname: string): CustomerPageId {
  if (pathname === "/booth" || pathname.startsWith("/booth/")) {
    return "map";
  }

  if (pathname === "/points" || pathname.startsWith("/points/")) {
    return "points";
  }

  if (pathname === "/history") {
    return "history";
  }

  return navigationTabs.find((tab) => tab.path === pathname)?.id ?? "home";
}

function getPointTabIdFromPathname(pathname: string): CustomerPointTabId {
  if (pathname === "/points/worldcup" || pathname.startsWith("/points/worldcup/")) {
    return "worldcup";
  }

  return "daily";
}

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasStoredCustomerSession());
  const [isAuthChecking, setIsAuthChecking] = useState(() => isCustomerApiEnabled());
  const [loginStep, setLoginStep] = useState<CustomerLoginStep>("github");
  const [activePageId, setActivePageId] = useState<CustomerPageId>(() =>
    getPageIdFromPathname(window.location.pathname),
  );
  const [activePointTabId, setActivePointTabId] = useState<CustomerPointTabId>(() =>
    getPointTabIdFromPathname(window.location.pathname),
  );

  useEffect(() => {
    const handlePopState = () => {
      const nextPathname = window.location.pathname;

      setPathname(nextPathname);
      setActivePageId(getPageIdFromPathname(nextPathname));
      setActivePointTabId(getPointTabIdFromPathname(nextPathname));
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (isAuthChecking || isAuthenticated || pathname === "/login") {
      return;
    }

    if (!isAuthenticated) {
      pushCustomerPath("/login");
    }
  }, [isAuthChecking, isAuthenticated, pathname]);

  useEffect(() => {
    if (!isCustomerApiEnabled() || isGithubLoginSuccessRedirect()) {
      return undefined;
    }

    let isActive = true;

    void checkCustomerSession()
      .then((result) => {
        if (!isActive) {
          return;
        }

        if (result.status === "authenticated") {
          setIsAuthenticated(true);

          if (window.location.pathname === "/login") {
            pushCustomerPath("/");
          }

          return;
        }

        setIsAuthenticated(false);

        if (result.status === "profile_required") {
          setLoginStep("profile");

          if (window.location.pathname !== "/login") {
            pushCustomerPath("/login");
          }
        }
      })
      .catch(() => {
        if (isActive) {
          setIsAuthenticated(false);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsAuthChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated || pathname !== "/login" || !isGithubLoginSuccessRedirect()) {
      return;
    }

    void completeGithubAuthentication()
      .then((result) => {
        if (result.status === "authenticated") {
          setIsAuthenticated(true);
          pushCustomerPath("/");

          return;
        }

        setIsAuthenticated(false);
        setLoginStep("profile");
      })
      .catch(() => {
        setIsAuthenticated(false);
        setLoginStep("github");
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, [isAuthenticated, pathname]);

  const handleTabChange = (tab: NavigationTab) => {
    setActivePageId(tab.id);

    if (tab.id !== "points") {
      setActivePointTabId("daily");
    }

    if (window.location.pathname !== tab.path) {
      window.history.pushState({ customerPageId: tab.id }, "", tab.path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handlePointTabChange = (tabId: CustomerPointTabId) => {
    const pathname = tabId === "worldcup" ? "/points/worldcup" : "/points";

    setActivePageId("points");
    setActivePointTabId(tabId);

    if (window.location.pathname !== pathname) {
      window.history.pushState({ customerPageId: "points", customerPointTabId: tabId }, "", pathname);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const isLoginPath = pathname === "/login";
  const shouldRenderLogin = isLoginPath || !isAuthenticated;
  const shouldShowBottomTabbar = !shouldRenderLogin && !pathname.startsWith("/booth/");

  return (
    <CustomerAppShell>
      <div className="customer-route-transition" key={pathname}>
        {shouldRenderLogin ? (
          <CustomerLoginPage
            initialStep={loginStep}
            key={loginStep}
            onGithubAuthenticated={async () => {
              const result = await completeGithubAuthentication();

              if (result.status === "authenticated") {
                setIsAuthenticated(true);
                pushCustomerPath("/");
              } else {
                setLoginStep("profile");
              }

              return result;
            }}
            onLogin={async (profile) => {
              await completeStudentProfile(profile);
              setIsAuthenticated(true);
            }}
          />
        ) : (
          <>
            {activePageId === "home" ? <CustomerHomePage /> : null}
            {activePageId === "pay" ? <CustomerPayPage /> : null}
            {activePageId === "map" ? <CustomerMapPage /> : null}
            {activePageId === "points" ? <CustomerPointsPage activeTabId={activePointTabId} /> : null}
            {activePageId === "all" ? <CustomerAllPage /> : null}
            {activePageId === "history" ? <CustomerHistoryPage /> : null}
            {activePageId !== "home" &&
            activePageId !== "pay" &&
            activePageId !== "map" &&
            activePageId !== "points" &&
            activePageId !== "all" &&
            activePageId !== "history" ? (
              <CustomerTabPage />
            ) : null}
          </>
        )}
      </div>
      {shouldShowBottomTabbar ? (
        <BottomTabbar
          activePointTab={activePointTabId}
          activeTabId={activePageId === "history" ? "home" : activePageId}
          onPointTabChange={handlePointTabChange}
          onTabChange={handleTabChange}
          tabs={navigationTabs}
        />
      ) : null}
    </CustomerAppShell>
  );
}
