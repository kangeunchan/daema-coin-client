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
import type { RankingEntry, RecentTransaction, WalletAsset } from "../../entities/customer-home";
import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  emptyWalletAssets,
  mapLedgerRecentTransaction,
  mapCustomerRankingEntry,
  mapWalletAsset,
} from "../../shared/api/customerDataMappers";
import { fetchCustomerLedgerRecent } from "../../shared/api/ledger";
import { fetchCustomerUserRankings } from "../../shared/api/rankings";
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
  const [apiPersonalRankings, setApiPersonalRankings] = useState<
    readonly RankingEntry[] | undefined
  >(() => (isApiMode ? [] : undefined));

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void Promise.allSettled([
      fetchCustomerWalletBalances(),
      fetchCustomerLedgerRecent(),
      fetchCustomerUserRankings(),
    ]).then(([walletResult, ledgerResult, rankingsResult]) => {
      if (isCancelled) {
        return;
      }

      if (walletResult.status === "fulfilled") {
        const mappedWalletAssets = walletResult.value.balances
          .map(mapWalletAsset)
          .filter((asset): asset is WalletAsset => asset !== undefined);

        setApiWalletAssets(mappedWalletAssets.length > 0 ? mappedWalletAssets : emptyWalletAssets);
      } else {
        setApiWalletAssets(emptyWalletAssets);
      }

      if (ledgerResult.status === "fulfilled") {
        setApiRecentTransactions(ledgerResult.value.map(mapLedgerRecentTransaction));
      } else {
        setApiRecentTransactions([]);
      }

      if (rankingsResult.status === "fulfilled") {
        const mappedPersonalRankings = rankingsResult.value
          .map(mapCustomerRankingEntry)
          .filter((ranking): ranking is RankingEntry => ranking !== undefined)
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 3);

        setApiPersonalRankings(
          mappedPersonalRankings.length > 0 ? mappedPersonalRankings : personalPodiumRankings,
        );

        return;
      }

      setApiPersonalRankings(personalPodiumRankings);
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const walletAssetSource = isApiMode ? (apiWalletAssets ?? emptyWalletAssets) : walletAssets;
  const recentTransactionSource = isApiMode ? (apiRecentTransactions ?? []) : recentTransactions;
  const personalRankingSource = isApiMode
    ? (apiPersonalRankings ?? personalPodiumRankings)
    : personalPodiumRankings;

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
        rankings={personalRankingSource}
        title="개인 대마포인트 랭킹"
      />
      <SinglePromoBanner banner={festivalBanner} />
      <RankingCard
        direction="right"
        rankings={boothPodiumRankings}
        title="부스 대마포인트 랭킹"
        unavailable
      />
    </>
  );
}
