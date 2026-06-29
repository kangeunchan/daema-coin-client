import { useState } from "react";
import type { UIEvent } from "react";
import { ChevronRightIcon, CircleStackIcon } from "@heroicons/react/24/solid";
import { Button } from "@daema/ui/button";

import type { WalletAsset } from "../../entities/customer-home";
import { navigateCustomerPathFromClick } from "../../shared/lib/customerNavigation";

type WalletOverviewProps = {
  assets: readonly WalletAsset[];
};

type WalletAssetSlideProps = {
  asset: WalletAsset;
};

type WalletPaginationDotsProps = {
  activeIndex: number;
  assets: readonly WalletAsset[];
};

const emptyWalletOverviewAssets = [
  { label: "대마코인", value: "0 DMC" },
  { label: "대마포인트", value: "0 P" },
] satisfies readonly WalletAsset[];

export function WalletAssetLabel({ label }: Pick<WalletAsset, "label">) {
  return <span className="customer-wallet__label">{label}</span>;
}

export function WalletAssetValue({ value }: Pick<WalletAsset, "value">) {
  return (
    <span className="customer-wallet__value-link">
      <strong className="customer-wallet__value">{value}</strong>
      <ChevronRightIcon aria-hidden="true" className="customer-wallet__chevron" />
    </span>
  );
}

export function WalletHistoryLink() {
  return (
    <Button asChild className="customer-wallet__history" intent="ghost" size="sm">
      <a
        href="/history"
        onClick={(event) => {
          navigateCustomerPathFromClick(event, "/history");
        }}
      >
        내역
      </a>
    </Button>
  );
}

export function WalletBenefitLink() {
  return (
    <a className="customer-wallet__benefit" href="/" onClick={(event) => event.preventDefault()}>
      <span className="customer-wallet__benefit-icon">
        <CircleStackIcon aria-hidden="true" />
      </span>
      <span className="customer-wallet__benefit-text">
        <strong>+이자 혜택 받기</strong>
        <span>daema 포인트</span>
      </span>
      <ChevronRightIcon aria-hidden="true" className="customer-wallet__benefit-arrow" />
    </a>
  );
}

export function WalletAssetSlide({ asset }: WalletAssetSlideProps) {
  return (
    <div className="customer-wallet__slide">
      <WalletAssetLabel label={asset.label} />
      <div className="customer-wallet__amount-row">
        <WalletAssetValue value={asset.value} />
        <WalletHistoryLink />
      </div>
      <WalletBenefitLink />
    </div>
  );
}

export function WalletPaginationDots({ activeIndex, assets }: WalletPaginationDotsProps) {
  return (
    <div aria-label={`${activeIndex + 1} / ${assets.length}`} className="customer-wallet__dots">
      {assets.map((asset, index) => (
        <span
          aria-current={activeIndex === index ? "true" : undefined}
          className="customer-wallet__dot"
          key={asset.label}
        />
      ))}
    </div>
  );
}

export function WalletOverview({ assets }: WalletOverviewProps) {
  const [activeAsset, setActiveAsset] = useState(0);
  const displayAssets = assets.length > 0 ? assets : emptyWalletOverviewAssets;
  const normalizedActiveAsset = Math.min(activeAsset, displayAssets.length - 1);
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
    setActiveAsset(Math.min(Math.max(nextIndex, 0), displayAssets.length - 1));
  };

  return (
    <div className="customer-wallet">
      <div className="customer-wallet__pager">
        <div aria-label="보유 자산" className="customer-wallet__scroller" onScroll={handleScroll}>
          {displayAssets.map((asset) => (
            <WalletAssetSlide asset={asset} key={asset.label} />
          ))}
        </div>
        <WalletPaginationDots activeIndex={normalizedActiveAsset} assets={displayAssets} />
      </div>
    </div>
  );
}
