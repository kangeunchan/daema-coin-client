import { lazy, Suspense, useEffect, useRef, useState } from "react";

import { navigationTabs } from "../entities/customer-home";
import type { NavigationTab } from "../entities/customer-home";
import { CustomerLoginPage } from "../pages/login/CustomerLoginPage";
import {
  checkCustomerSession,
  completeGithubAuthentication,
  completeStudentProfile,
  hasStoredCustomerSession,
  isGithubLoginSuccessRedirect,
} from "../shared/api/auth";
import { isCustomerApiEnabled } from "../shared/api/client";
import {
  getCurrentCustomerPathname,
  pushCustomerPath,
} from "../shared/lib/customerNavigation";
import { useCustomerPathname } from "../shared/lib/useCustomerPathname";
import { BottomTabbar } from "../widgets/bottom-tabbar";
import { CustomerAppShell } from "./ui/CustomerAppShell";

const CustomerAllPage = lazy(() =>
  import("../pages/all/CustomerAllPage").then((module) => ({ default: module.CustomerAllPage })),
);
const CustomerHistoryPage = lazy(() =>
  import("../pages/history/CustomerHistoryPage").then((module) => ({
    default: module.CustomerHistoryPage,
  })),
);
const CustomerHomePage = lazy(() =>
  import("../pages/home/CustomerHomePage").then((module) => ({ default: module.CustomerHomePage })),
);
const CustomerMapPage = lazy(() =>
  import("../pages/map/CustomerMapPage").then((module) => ({ default: module.CustomerMapPage })),
);
const CustomerPayPage = lazy(() =>
  import("../pages/pay/CustomerPayPage").then((module) => ({ default: module.CustomerPayPage })),
);
const CustomerPointsPage = lazy(() =>
  import("../pages/points/CustomerPointsPage").then((module) => ({
    default: module.CustomerPointsPage,
  })),
);
const CustomerTabPage = lazy(() =>
  import("../pages/tab/CustomerTabPage").then((module) => ({ default: module.CustomerTabPage })),
);

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
  const pathname = useCustomerPathname();
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasStoredCustomerSession());
  const [isAuthChecking, setIsAuthChecking] = useState(() => isCustomerApiEnabled());
  const [loginStep, setLoginStep] = useState<CustomerLoginStep>("github");
  const [unsupportedNoticeKey, setUnsupportedNoticeKey] = useState(0);
  const [isUnsupportedNoticeVisible, setIsUnsupportedNoticeVisible] = useState(false);
  const unsupportedNoticeTimerRef = useRef<number | undefined>(undefined);
  const activePageId = getPageIdFromPathname(pathname);
  const activePointTabId = getPointTabIdFromPathname(pathname);

  const showUnsupportedNotice = () => {
    if (unsupportedNoticeTimerRef.current) {
      window.clearTimeout(unsupportedNoticeTimerRef.current);
    }

    setUnsupportedNoticeKey((key) => key + 1);
    setIsUnsupportedNoticeVisible(true);

    unsupportedNoticeTimerRef.current = window.setTimeout(() => {
      setIsUnsupportedNoticeVisible(false);
    }, 1800);
  };

  useEffect(
    () => () => {
      if (unsupportedNoticeTimerRef.current) {
        window.clearTimeout(unsupportedNoticeTimerRef.current);
      }
    },
    [],
  );

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

          if (getCurrentCustomerPathname() === "/login") {
            pushCustomerPath("/");
          }

          return;
        }

        setIsAuthenticated(false);

        if (result.status === "profile_required") {
          setLoginStep("profile");

          if (getCurrentCustomerPathname() !== "/login") {
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
    if (tab.id === "map") {
      showUnsupportedNotice();
      return;
    }

    pushCustomerPath(tab.path);
  };

  const handlePointTabChange = (tabId: CustomerPointTabId) => {
    const pathname = tabId === "worldcup" ? "/points/worldcup" : "/points";

    pushCustomerPath(pathname);
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
          <Suspense fallback={<div aria-label="페이지 불러오는 중" role="status" />}>
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
          </Suspense>
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
      {isUnsupportedNoticeVisible ? (
        <div
          aria-live="polite"
          className="customer-unsupported-floating-notice"
          key={unsupportedNoticeKey}
          role="status"
        >
          아직은 지원되지 않는 기능입니다.
        </div>
      ) : null}
    </CustomerAppShell>
  );
}
