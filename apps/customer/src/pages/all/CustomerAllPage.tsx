import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  BuildingStorefrontIcon,
  CircleStackIcon,
  CreditCardIcon,
  HomeIcon,
  TrophyIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";

import { getStoredCustomerProfile } from "../../shared/api/auth";
import { isCustomerApiEnabled } from "../../shared/api/client";
import { fetchCustomerMe } from "../../shared/api/customer";
import { pushCustomerPath } from "../../shared/lib/customerNavigation";

const appFeatureItems = [
  { href: "/", icon: HomeIcon, label: "홈 대시보드", tone: "#64748b" },
  { href: "/pay", icon: CreditCardIcon, label: "바코드 결제", tone: "#0f766e" },
  { href: "/history", icon: WalletIcon, label: "내역", tone: "#94a3b8" },
  { href: "/points", icon: CircleStackIcon, label: "매일 커밋 모으기", tone: "#22c55e" },
  { href: "/points/worldcup", icon: TrophyIcon, label: "월드컵 승부예측", tone: "#2563eb" },
  { href: "/booth", icon: BuildingStorefrontIcon, label: "부스 쇼핑 홈", tone: "#2563eb" },
] as const;

export function CustomerAllPage() {
  const [displayName, setDisplayName] = useState(
    () => getStoredCustomerProfile()?.name ?? "사용자",
  );

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return undefined;
    }

    let isActive = true;

    void fetchCustomerMe()
      .then((customer) => {
        if (!isActive) {
          return;
        }

        setDisplayName(customer.displayName ?? customer.github?.login ?? "사용자");
      })
      .catch(() => {
        if (isActive) {
          setDisplayName("사용자");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main className="customer-all-page" aria-labelledby="customer-all-title">
      <header className="customer-all-header">
        <h1 id="customer-all-title">{displayName}</h1>
        <nav aria-label="전체 메뉴 보조 링크">
          <a
            href="/pay"
            onClick={(event) => {
              event.preventDefault();
              pushCustomerPath("/pay");
            }}
          >
            페이
          </a>
          <span aria-hidden="true">|</span>
          <a
            href="/points"
            onClick={(event) => {
              event.preventDefault();
              pushCustomerPath("/points");
            }}
          >
            포인트
          </a>
        </nav>
      </header>

      <section className="customer-all-events" aria-labelledby="customer-all-events-title">
        <h2 id="customer-all-events-title">사용 중인 기능</h2>
        <ul>
          {appFeatureItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    pushCustomerPath(item.href);
                  }}
                >
                  <span
                    className="customer-all-event-icon"
                    style={{ "--customer-all-event-tone": item.tone } as CSSProperties}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
