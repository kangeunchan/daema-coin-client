import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeftIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { FaFutbol } from "react-icons/fa6";

import type { IconComponent, NavigationTab } from "../../entities/customer-home";
import {
  navigateCustomerPathFromClick,
  shouldHandleCustomerNavigationClick,
} from "../../shared/lib/customerNavigation";
import { useCustomerPathname } from "../../shared/lib/useCustomerPathname";

const worldcupMatchLabels: Record<string, string> = {
  "623-ar-at": "아르헨티나 vs 오스트리아",
  "623-fr-iq": "프랑스 vs 이라크",
  "623-jo-dz": "요르단 vs 알제리",
  "623-no-sn": "노르웨이 vs 세네갈",
  "625-kr-mx": "대한민국 vs 멕시코",
  "626-no-fr": "노르웨이 vs 프랑스",
  "626-sn-iq": "세네갈 vs 이라크",
  "627-dz-at": "알제리 vs 오스트리아",
  "627-jo-ar": "요르단 vs 아르헨티나",
};

type BottomTabbarProps = {
  activeTabId: NavigationTab["id"];
  activePointTab: "daily" | "worldcup";
  onTabChange: (tab: NavigationTab) => void;
  onPointTabChange: (tab: "daily" | "worldcup") => void;
  tabs: readonly NavigationTab[];
};

type PrimaryTabItemProps = {
  isActive: boolean;
  isScrolling: boolean;
  onTabChange: (tab: NavigationTab) => void;
  tab: NavigationTab;
};

type PointBackButtonProps = {
  backHref: string;
  isWorldcupDetail: boolean;
  onBackToHome: () => void;
};

type PointTabItemProps = {
  active: boolean;
  icon: IconComponent;
  label: string;
  onClick: () => void;
};

function getWorldcupMatchLabel(pathname: string) {
  const matchId = pathname.replace(/^\/points\/worldcup\/?/, "");

  return worldcupMatchLabels[matchId];
}

export function PrimaryTabIndicator() {
  return <span aria-hidden="true" className="customer-tabbar__indicator" />;
}

export function PrimaryTabItem({
  isActive,
  isScrolling,
  onTabChange,
  tab,
}: PrimaryTabItemProps) {
  const { icon: Icon, label } = tab;

  return (
    <a
      aria-current={isActive ? "page" : undefined}
      className="customer-tabbar__item"
      data-active={isActive && !isScrolling ? "true" : undefined}
      href={tab.path}
      onClick={(event) => {
        if (!shouldHandleCustomerNavigationClick(event)) {
          return;
        }

        event.preventDefault();
        onTabChange(tab);
      }}
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </a>
  );
}

export function PointBackButton({
  backHref,
  isWorldcupDetail,
  onBackToHome,
}: PointBackButtonProps) {
  return (
    <a
      aria-label={isWorldcupDetail ? "승부예측 목록으로 돌아가기" : "홈으로 돌아가기"}
      className="customer-point-tabbar__back"
      href={backHref}
      onClick={(event) => {
        if (isWorldcupDetail) {
          navigateCustomerPathFromClick(event, "/points/worldcup");
          return;
        }

        event.preventDefault();
        onBackToHome();
      }}
    >
      <ArrowLeftIcon aria-hidden="true" />
    </a>
  );
}

export function PointTabItem({ active, icon: Icon, label, onClick }: PointTabItemProps) {
  return (
    <button
      className="customer-point-tabbar__item"
      data-active={active ? "true" : undefined}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function PointMatchLabel({ label }: { label?: string | undefined }) {
  return (
    <div className="customer-point-tabbar__match" aria-current="page">
      <FaFutbol aria-hidden="true" />
      <span>{label ?? "월드컵 경기"}</span>
    </div>
  );
}

export function BottomTabbar({
  activePointTab,
  activeTabId,
  onPointTabChange,
  onTabChange,
  tabs,
}: BottomTabbarProps) {
  const activeTabIndex = Math.max(
    tabs.findIndex((tab) => tab.id === activeTabId),
    0,
  );
  const [isScrolling, setIsScrolling] = useState(false);
  const pathname = useCustomerPathname();
  const scrollTimerRef = useRef<number | undefined>(undefined);
  const tabbarStyle = {
    "--customer-active-tab": activeTabIndex,
    "--customer-tab-count": tabs.length,
  } as CSSProperties;

  useEffect(() => {
    const handleWindowScroll = () => {
      setIsScrolling(true);

      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }

      scrollTimerRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 160);
    };

    window.addEventListener("scroll", handleWindowScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);

      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  if (activeTabId === "points") {
    const homeTab = tabs.find((tab) => tab.id === "home");
    const isWorldcupDetail = pathname.startsWith("/points/worldcup/");
    const backHref = isWorldcupDetail ? "/points/worldcup" : (homeTab?.path ?? "/");
    const worldcupMatchLabel = getWorldcupMatchLabel(pathname);
    const handleBackToHome = () => {
      if (homeTab) {
        onTabChange(homeTab);
      }
    };

    return (
      <nav
        aria-label="포인트"
        className="customer-point-tabbar"
        data-detail={isWorldcupDetail ? "true" : undefined}
      >
        <PointBackButton
          backHref={backHref}
          isWorldcupDetail={isWorldcupDetail}
          onBackToHome={handleBackToHome}
        />
        {isWorldcupDetail ? (
          <PointMatchLabel label={worldcupMatchLabel} />
        ) : (
          <>
            <PointTabItem
              active={activePointTab === "daily"}
              icon={CalendarDaysIcon}
              label="일일"
              onClick={() => onPointTabChange("daily")}
            />
            <PointTabItem
              active={activePointTab === "worldcup"}
              icon={FaFutbol}
              label="월드컵"
              onClick={() => onPointTabChange("worldcup")}
            />
          </>
        )}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Primary"
      className="customer-tabbar"
      data-scrolling={isScrolling ? "true" : undefined}
      style={tabbarStyle}
    >
      <PrimaryTabIndicator />
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;

        return (
          <PrimaryTabItem
            isActive={isActive}
            isScrolling={isScrolling}
            key={tab.label}
            onTabChange={onTabChange}
            tab={tab}
          />
        );
      })}
    </nav>
  );
}
