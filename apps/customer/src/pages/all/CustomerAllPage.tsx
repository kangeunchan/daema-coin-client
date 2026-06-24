import type { CSSProperties } from "react";
import {
  BoltIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  CreditCardIcon,
  GiftIcon,
  HomeIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TicketIcon,
  TrophyIcon,
  WalletIcon,
} from "@heroicons/react/24/solid";

import { pushCustomerPath } from "../../shared/lib/customerNavigation";

const appFeatureItems = [
  { href: "/", icon: HomeIcon, label: "홈 대시보드", tone: "#64748b" },
  { href: "/pay", icon: BoltIcon, label: "대마페이 바로 결제", tone: "#2563eb" },
  { href: "/pay", icon: CreditCardIcon, label: "바코드 결제", tone: "#0f766e" },
  { href: "/history", icon: WalletIcon, label: "내역", tone: "#94a3b8" },
  { href: "/", icon: GiftIcon, label: "코드 작성 혜택", tone: "#10b981" },
  { href: "/points", icon: CircleStackIcon, label: "매일 커밋 모으기", tone: "#22c55e" },
  { href: "/points", icon: SparklesIcon, label: "커밋 잔디", tone: "#16a34a" },
  { href: "/points/worldcup", icon: TrophyIcon, label: "월드컵 승부예측", tone: "#2563eb" },
  { href: "/points/worldcup", icon: CalendarDaysIcon, label: "일별 경기 일정", tone: "#475569" },
  { href: "/booth", icon: BuildingStorefrontIcon, label: "부스 쇼핑 홈", tone: "#2563eb" },
  { href: "/booth", icon: ShoppingBagIcon, label: "추천 부스 상품", tone: "#14b8a6" },
  { href: "/booth/qr-terminal", icon: TicketIcon, label: "행사 입장 QR 단말기", tone: "#8b5cf6" },
  { href: "/booth/premium-lounge", icon: SparklesIcon, label: "프리미엄 휴식 라운지", tone: "#111827" },
] as const;

export function CustomerAllPage() {
  return (
    <main className="customer-all-page" aria-labelledby="customer-all-title">
      <header className="customer-all-header">
        <h1 id="customer-all-title">강은찬</h1>
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
