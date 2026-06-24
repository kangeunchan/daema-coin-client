import { useEffect, useState } from "react";
import { Surface } from "@daema/ui/surface";

import {
  boothPodiumRankings,
  festivalBanner,
  personalPodiumRankings,
  promoBanners,
  recentTransactions,
  shortcuts,
  walletAssets,
} from "../../entities/customer-home";
import type { RecentTransaction, WalletAsset } from "../../entities/customer-home";
import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  emptyWalletAssets,
  mapLedgerRecentTransaction,
  mapWalletAsset,
} from "../../shared/api/customerDataMappers";
import { fetchCustomerLedgerRecent } from "../../shared/api/ledger";
import { fetchCustomerWalletBalances } from "../../shared/api/wallet";
import { AppHeader } from "../../widgets/app-header";
import { NoticeBar } from "../../widgets/notice-bar";
import { PromoBanners, SinglePromoBanner } from "../../widgets/promo-banners";
import { RankingCard } from "../../widgets/ranking-podium";
import { RecentTransactions } from "../../widgets/recent-transactions";
import { ShortcutGrid } from "../../widgets/shortcut-grid";
import { WalletOverview } from "../../widgets/wallet-overview";

export function CustomerHomePage() {
  const isApiMode = isCustomerApiEnabled();
  const [apiWalletAssets, setApiWalletAssets] = useState<readonly WalletAsset[] | undefined>(() =>
    isApiMode ? emptyWalletAssets : undefined,
  );
  const [apiRecentTransactions, setApiRecentTransactions] = useState<
    readonly RecentTransaction[] | undefined
  >(() => (isApiMode ? [] : undefined));

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void Promise.all([fetchCustomerWalletBalances(), fetchCustomerLedgerRecent()])
      .then(([wallet, ledger]) => {
        if (isCancelled) {
          return;
        }

        const mappedWalletAssets = wallet.balances
          .map(mapWalletAsset)
          .filter((asset): asset is WalletAsset => asset !== undefined);
        const mappedRecentTransactions = ledger.map(mapLedgerRecentTransaction);

        setApiWalletAssets(mappedWalletAssets.length > 0 ? mappedWalletAssets : emptyWalletAssets);
        setApiRecentTransactions(mappedRecentTransactions);
      })
      .catch(() => {
        if (!isCancelled) {
          setApiWalletAssets(emptyWalletAssets);
          setApiRecentTransactions([]);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const walletAssetSource = isApiMode ? (apiWalletAssets ?? emptyWalletAssets) : walletAssets;
  const recentTransactionSource = isApiMode ? (apiRecentTransactions ?? []) : recentTransactions;

  return (
    <>
      <AppHeader />
      <NoticeBar />

      <Surface asChild className="customer-main-action" padding="none">
        <section>
          <WalletOverview assets={walletAssetSource} />
          <ShortcutGrid shortcuts={shortcuts} />
        </section>
      </Surface>

      <PromoBanners banners={promoBanners} />
      <RecentTransactions href="/history" transactions={recentTransactionSource} />
      <RankingCard
        direction="left"
        rankings={personalPodiumRankings}
        title="개인 대마포인트 랭킹"
      />
      <SinglePromoBanner banner={festivalBanner} />
      <RankingCard direction="right" rankings={boothPodiumRankings} title="부스 대마포인트 랭킹" />
    </>
  );
}
