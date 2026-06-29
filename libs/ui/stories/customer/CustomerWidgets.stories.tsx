import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  boothPodiumRankings,
  festivalBanner,
  navigationTabs,
  personalPodiumRankings,
  promoBanners,
  recentTransactions,
  shortcuts,
  walletAssets,
} from "../../../../apps/customer/src/entities/customer-home/model/homeContent";
import { AppHeader } from "../../../../apps/customer/src/widgets/app-header";
import { BottomTabbar } from "../../../../apps/customer/src/widgets/bottom-tabbar";
import { NoticeBar } from "../../../../apps/customer/src/widgets/notice-bar";
import { PromoBanners, SinglePromoBanner } from "../../../../apps/customer/src/widgets/promo-banners";
import { RankingCard } from "../../../../apps/customer/src/widgets/ranking-podium";
import { RecentTransactions } from "../../../../apps/customer/src/widgets/recent-transactions";
import { ShortcutGrid } from "../../../../apps/customer/src/widgets/shortcut-grid";
import { WalletOverview } from "../../../../apps/customer/src/widgets/wallet-overview";

const meta = {
  title: "Customer/Widgets",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function CustomerFrame({ children }: { children: ReactNode }) {
  return (
    <div className="daema-customer-story">
      <div className="daema-customer-story__frame">{children}</div>
    </div>
  );
}

export const HomeStack: Story = {
  render: () => (
    <CustomerFrame>
      <AppHeader />
      <main className="daema-customer-story__content">
        <WalletOverview assets={walletAssets} />
        <ShortcutGrid shortcuts={shortcuts} />
        <NoticeBar />
        <PromoBanners banners={promoBanners} />
        <SinglePromoBanner banner={festivalBanner} />
        <RecentTransactions href="/history" transactions={recentTransactions} />
        <RankingCard direction="left" rankings={personalPodiumRankings} title="개인 포인트 랭킹" />
        <RankingCard direction="right" rankings={boothPodiumRankings} title="부스 포인트 랭킹" />
      </main>
      <div className="daema-customer-story__bottom">
        <BottomTabbar
          activePointTab="daily"
          activeTabId="home"
          onPointTabChange={() => undefined}
          onTabChange={() => undefined}
          tabs={navigationTabs}
        />
      </div>
    </CustomerFrame>
  ),
};

export const Header: Story = {
  render: () => (
    <CustomerFrame>
      <AppHeader stickyActions />
    </CustomerFrame>
  ),
};

export const Wallet: Story = {
  render: () => (
    <CustomerFrame>
      <main className="daema-customer-story__content">
        <WalletOverview assets={walletAssets} />
        <WalletOverview assets={[]} />
      </main>
    </CustomerFrame>
  ),
};

export const Shortcuts: Story = {
  render: () => (
    <CustomerFrame>
      <main className="daema-customer-story__content">
        <ShortcutGrid shortcuts={shortcuts} />
      </main>
    </CustomerFrame>
  ),
};

export const Banners: Story = {
  render: () => (
    <CustomerFrame>
      <main className="daema-customer-story__content">
        <PromoBanners banners={promoBanners} />
        <SinglePromoBanner banner={festivalBanner} />
      </main>
    </CustomerFrame>
  ),
};

export const Activity: Story = {
  render: () => (
    <CustomerFrame>
      <main className="daema-customer-story__content">
        <RecentTransactions href="/history" transactions={recentTransactions} />
        <RecentTransactions title="빈 내역" transactions={[]} />
      </main>
    </CustomerFrame>
  ),
};

export const Rankings: Story = {
  render: () => (
    <CustomerFrame>
      <main className="daema-customer-story__content">
        <RankingCard direction="left" rankings={personalPodiumRankings} title="개인 포인트 랭킹" />
        <RankingCard direction="right" rankings={boothPodiumRankings} title="부스 포인트 랭킹" />
        <RankingCard
          direction="left"
          rankings={personalPodiumRankings}
          title="준비 중인 랭킹"
          unavailable
        />
      </main>
    </CustomerFrame>
  ),
};

export const Navigation: Story = {
  render: () => (
    <CustomerFrame>
      <div className="daema-customer-story__bottom">
        <BottomTabbar
          activePointTab="daily"
          activeTabId="home"
          onPointTabChange={() => undefined}
          onTabChange={() => undefined}
          tabs={navigationTabs}
        />
      </div>
    </CustomerFrame>
  ),
};

export const PointNavigation: Story = {
  render: () => (
    <CustomerFrame>
      <div className="daema-customer-story__bottom">
        <BottomTabbar
          activePointTab="worldcup"
          activeTabId="points"
          onPointTabChange={() => undefined}
          onTabChange={() => undefined}
          tabs={navigationTabs}
        />
      </div>
    </CustomerFrame>
  ),
};
