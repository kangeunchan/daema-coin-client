import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeftIcon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { FaFutbol } from "react-icons/fa6";

import type { NavigationTab } from "../../entities/customer-home";

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

function getWorldcupMatchLabel(pathname: string) {
  const matchId = pathname.replace(/^\/points\/worldcup\/?/, "");

  return worldcupMatchLabels[matchId];
}

type BottomTabbarProps = {
  activeTabId: NavigationTab["id"];
  activePointTab: "daily" | "worldcup";
  onTabChange: (tab: NavigationTab) => void;
  onPointTabChange: (tab: "daily" | "worldcup") => void;
  tabs: readonly NavigationTab[];
};

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
  const [pathname, setPathname] = useState(() => window.location.pathname);
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

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  if (activeTabId === "points") {
    const homeTab = tabs.find((tab) => tab.id === "home");
    const isWorldcupDetail = pathname.startsWith("/points/worldcup/");
    const backHref = isWorldcupDetail ? "/points/worldcup" : (homeTab?.path ?? "/");
    const worldcupMatchLabel = getWorldcupMatchLabel(pathname);

    return (
      <nav
        aria-label="포인트"
        className="customer-point-tabbar"
        data-detail={isWorldcupDetail ? "true" : undefined}
      >
        <a
          aria-label={isWorldcupDetail ? "승부예측 목록으로 돌아가기" : "홈으로 돌아가기"}
          className="customer-point-tabbar__back"
          href={backHref}
          onClick={(event) => {
            if (isWorldcupDetail) {
              event.preventDefault();
              window.history.pushState(
                { customerPageId: "points", customerPointTabId: "worldcup" },
                "",
                "/points/worldcup",
              );
              window.dispatchEvent(new Event("popstate"));
              return;
            }

            if (!homeTab) {
              return;
            }

            event.preventDefault();
            onTabChange(homeTab);
          }}
        >
          <ArrowLeftIcon aria-hidden="true" />
        </a>
        {isWorldcupDetail ? (
          <div className="customer-point-tabbar__match" aria-current="page">
            <FaFutbol aria-hidden="true" />
            <span>{worldcupMatchLabel ?? "월드컵 경기"}</span>
          </div>
        ) : (
          <>
            <button
              className="customer-point-tabbar__item"
              data-active={activePointTab === "daily" ? "true" : undefined}
              onClick={() => onPointTabChange("daily")}
              type="button"
            >
              <CalendarDaysIcon aria-hidden="true" />
              <span>일일</span>
            </button>
            <button
              className="customer-point-tabbar__item"
              data-active={activePointTab === "worldcup" ? "true" : undefined}
              onClick={() => onPointTabChange("worldcup")}
              type="button"
            >
              <FaFutbol aria-hidden="true" />
              <span>월드컵</span>
            </button>
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
      <span aria-hidden="true" className="customer-tabbar__indicator" />
      {tabs.map((tab) => {
        const { icon: Icon, label } = tab;
        const isActive = activeTabId === tab.id;

        return (
          <a
            aria-current={isActive ? "page" : undefined}
            className="customer-tabbar__item"
            data-active={isActive && !isScrolling ? "true" : undefined}
            href={tab.path}
            key={label}
            onClick={(event) => {
              event.preventDefault();
              onTabChange(tab);
            }}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
