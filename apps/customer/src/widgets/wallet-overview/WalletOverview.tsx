import { useState } from "react";
import { ChevronRightIcon, CircleStackIcon } from "@heroicons/react/24/solid";
import { Button } from "@daema/ui/button";

import type { WalletAsset } from "../../entities/customer-home";
import { pushCustomerPath } from "../../shared/lib/customerNavigation";

type WalletOverviewProps = {
  assets: readonly WalletAsset[];
};

const emptyWalletOverviewAssets = [
  { label: "대마코인", value: "0 DMC" },
  { label: "대마포인트", value: "0 P" },
] satisfies readonly WalletAsset[];

export function WalletOverview({ assets }: WalletOverviewProps) {
  const [activeAsset, setActiveAsset] = useState(0);
  const displayAssets = assets.length > 0 ? assets : emptyWalletOverviewAssets;
  const normalizedActiveAsset = Math.min(activeAsset, displayAssets.length - 1);

  return (
    <div className="customer-wallet">
      <div className="customer-wallet__pager">
        <div
          aria-label="보유 자산"
          className="customer-wallet__scroller"
          onScroll={(event) => {
            const target = event.currentTarget;
            const nextIndex = Math.round(target.scrollLeft / target.clientWidth);
            setActiveAsset(Math.min(Math.max(nextIndex, 0), displayAssets.length - 1));
          }}
        >
          {displayAssets.map((asset) => (
            <div className="customer-wallet__slide" key={asset.label}>
              <span className="customer-wallet__label">{asset.label}</span>
              <div className="customer-wallet__amount-row">
                <span className="customer-wallet__value-link">
                  <strong className="customer-wallet__value">{asset.value}</strong>
                  <ChevronRightIcon aria-hidden="true" className="customer-wallet__chevron" />
                </span>
                <Button asChild className="customer-wallet__history" intent="ghost" size="sm">
                  <a
                    href="/history"
                    onClick={(event) => {
                      event.preventDefault();
                      pushCustomerPath("/history");
                    }}
                  >
                    내역
                  </a>
                </Button>
              </div>
              <a
                className="customer-wallet__benefit"
                href="/"
                onClick={(event) => event.preventDefault()}
              >
                <span className="customer-wallet__benefit-icon">
                  <CircleStackIcon aria-hidden="true" />
                </span>
                <span className="customer-wallet__benefit-text">
                  <strong>+이자 혜택 받기</strong>
                  <span>daema 포인트</span>
                </span>
                <ChevronRightIcon aria-hidden="true" className="customer-wallet__benefit-arrow" />
              </a>
            </div>
          ))}
        </div>
        <div
          aria-label={`${normalizedActiveAsset + 1} / ${displayAssets.length}`}
          className="customer-wallet__dots"
        >
          {displayAssets.map((asset, index) => (
            <span
              aria-current={normalizedActiveAsset === index ? "true" : undefined}
              className="customer-wallet__dot"
              key={asset.label}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
