import type { CSSProperties, ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  navigationTabs,
  personalPodiumRankings,
  promoBanners,
  recentTransactions,
  shortcuts,
  walletAssets,
} from "../../../../apps/customer/src/entities/customer-home/model/homeContent";
import { CustomerBrandLink, HeaderActions } from "../../../../apps/customer/src/widgets/app-header";
import {
  PointBackButton,
  PointMatchLabel,
  PointTabItem,
  PrimaryTabIndicator,
  PrimaryTabItem,
} from "../../../../apps/customer/src/widgets/bottom-tabbar";
import {
  PromoBannerContent,
  PromoBannerItem,
} from "../../../../apps/customer/src/widgets/promo-banners";
import {
  RankingCardHeader,
  RankingSlot,
  RankingUnavailableNotice,
} from "../../../../apps/customer/src/widgets/ranking-podium";
import {
  RecentTransactionItem,
  RecentTransactionsEmpty,
  RecentTransactionsHeader,
} from "../../../../apps/customer/src/widgets/recent-transactions";
import {
  ShortcutIcon,
  ShortcutItem,
  ShortcutLabel,
  UnsupportedFloatingNotice,
} from "../../../../apps/customer/src/widgets/shortcut-grid";
import {
  WalletAssetLabel,
  WalletAssetSlide,
  WalletAssetValue,
  WalletBenefitLink,
  WalletHistoryLink,
  WalletPaginationDots,
} from "../../../../apps/customer/src/widgets/wallet-overview";

const meta = {
  title: "Customer/Units",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function UnitCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="daema-customer-story">
      <div className="daema-customer-story__frame">
        <main className="daema-customer-story__content">{children}</main>
      </div>
    </div>
  );
}

export const HeaderUnits: Story = {
  render: () => (
    <UnitCanvas>
      <div className="customer-header">
        <CustomerBrandLink />
        <HeaderActions action="notifications" />
      </div>
      <div className="customer-header" data-scrolled="true" data-sticky-actions="true">
        <CustomerBrandLink />
        <HeaderActions action="cart" />
      </div>
    </UnitCanvas>
  ),
};

export const WalletUnits: Story = {
  render: () => (
    <UnitCanvas>
      <section className="customer-wallet">
        <div className="customer-wallet__pager">
          <WalletAssetSlide asset={walletAssets[0]} />
          <WalletPaginationDots activeIndex={0} assets={walletAssets} />
        </div>
      </section>
      <section className="daema-customer-story__section">
        <WalletAssetLabel label={walletAssets[1].label} />
        <WalletAssetValue value={walletAssets[1].value} />
        <WalletHistoryLink />
        <WalletBenefitLink />
      </section>
    </UnitCanvas>
  ),
};

export const ShortcutUnits: Story = {
  render: () => (
    <UnitCanvas>
      <div className="customer-shortcuts">
        {shortcuts.slice(0, 4).map((shortcut) => (
          <ShortcutItem
            key={shortcut.label}
            onUnsupportedClick={() => undefined}
            shortcut={shortcut}
          />
        ))}
      </div>
      <section className="daema-customer-story__section">
        <ShortcutIcon shortcut={shortcuts[4]} />
        <ShortcutLabel label={shortcuts[4].label} />
        <UnsupportedFloatingNotice noticeKey={1} />
      </section>
    </UnitCanvas>
  ),
};

export const PromoUnits: Story = {
  render: () => (
    <UnitCanvas>
      <PromoBannerItem banner={promoBanners[0]} />
      <div className="customer-promo">
        <PromoBannerContent banner={promoBanners[1]} />
      </div>
    </UnitCanvas>
  ),
};

export const RecentTransactionUnits: Story = {
  render: () => (
    <UnitCanvas>
      <section className="customer-recent">
        <RecentTransactionsHeader title="내역" />
        <div className="customer-recent__list">
          <RecentTransactionItem transaction={recentTransactions[0]} />
          <RecentTransactionItem transaction={recentTransactions[1]} />
          <RecentTransactionsEmpty />
        </div>
      </section>
    </UnitCanvas>
  ),
};

export const RankingUnits: Story = {
  render: () => (
    <UnitCanvas>
      <section className="customer-ranking">
        <RankingCardHeader title="랭킹 헤더" />
        <div className="customer-ranking__podium">
          <div className="customer-ranking__overlay">
            {personalPodiumRankings.map((item) => (
              <RankingSlot item={item} key={item.name} />
            ))}
          </div>
        </div>
        <RankingUnavailableNotice />
      </section>
    </UnitCanvas>
  ),
};

export const NavigationUnits: Story = {
  render: () => (
    <UnitCanvas>
      <nav
        aria-label="Primary"
        className="customer-tabbar"
        style={{ "--customer-active-tab": 0, "--customer-tab-count": 5 } as CSSProperties}
      >
        <PrimaryTabIndicator />
        {navigationTabs.slice(0, 3).map((tab, index) => (
          <PrimaryTabItem
            isActive={index === 0}
            isScrolling={false}
            key={tab.label}
            onTabChange={() => undefined}
            tab={tab}
          />
        ))}
      </nav>
      <nav aria-label="포인트" className="customer-point-tabbar">
        <PointBackButton
          backHref="/"
          isWorldcupDetail={false}
          onBackToHome={() => undefined}
        />
        <PointTabItem
          active
          icon={shortcuts[2].icon}
          label="일일"
          onClick={() => undefined}
        />
        <PointTabItem
          active={false}
          icon={shortcuts[3].icon}
          label="월드컵"
          onClick={() => undefined}
        />
      </nav>
      <nav aria-label="포인트 상세" className="customer-point-tabbar" data-detail="true">
        <PointBackButton
          backHref="/points/worldcup"
          isWorldcupDetail
          onBackToHome={() => undefined}
        />
        <PointMatchLabel label="대한민국 vs 멕시코" />
      </nav>
    </UnitCanvas>
  ),
};
