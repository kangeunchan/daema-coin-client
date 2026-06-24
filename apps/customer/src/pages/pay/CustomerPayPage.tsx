import { useEffect, useState } from "react";
import { BoltIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@daema/ui/icon-button";
import { Surface } from "@daema/ui/surface";
import Barcode from "react-barcode";

import { promoBanners, recentTransactions } from "../../entities/customer-home";
import type { RecentTransaction, WalletAsset } from "../../entities/customer-home";
import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  emptyWalletAssets,
  mapLedgerRecentTransaction,
  mapWalletAsset,
} from "../../shared/api/customerDataMappers";
import { fetchCustomerLedgerRecent } from "../../shared/api/ledger";
import { createCustomerPayBarcode } from "../../shared/api/pay";
import { fetchCustomerWalletBalances } from "../../shared/api/wallet";
import { AppHeader } from "../../widgets/app-header";
import { SinglePromoBanner } from "../../widgets/promo-banners";
import { RecentTransactions } from "../../widgets/recent-transactions";

const payCodeValue = "DAEMA-PAY:DMC:12480:USER-DEMO-0001";
const payCodeDisplayValue = "8801 2480 0622 0001";

function getDmcBalanceLabel(assets: readonly WalletAsset[]) {
  const dmcAsset =
    assets.find((asset) => asset.label.includes("대마코인")) ??
    assets.find((asset) => asset.value.endsWith("DMC"));

  return dmcAsset?.value.replace(/\s*DMC$/, "") ?? "0";
}

function formatPayCodeDisplay(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function PayBarcode({ displayValue, value }: { displayValue: string; value: string }) {
  return (
    <div aria-label="대마페이 바코드" className="customer-pay-barcode" role="img">
      <Barcode
        background="transparent"
        displayValue={false}
        height={76}
        margin={0}
        value={value}
        width={1.45}
      />
      <span className="customer-pay-barcode__number">{displayValue}</span>
    </div>
  );
}

export function CustomerPayPage() {
  const isApiMode = isCustomerApiEnabled();
  const [payFocusState, setPayFocusState] = useState<"idle" | "open" | "closing">("idle");
  const [payBarcode, setPayBarcode] = useState({
    displayValue: payCodeDisplayValue,
    value: payCodeValue,
  });
  const [apiWalletAssets, setApiWalletAssets] = useState<readonly WalletAsset[] | undefined>(() =>
    isApiMode ? emptyWalletAssets : undefined,
  );
  const [apiRecentTransactions, setApiRecentTransactions] = useState<
    readonly RecentTransaction[] | undefined
  >(() => (isApiMode ? [] : undefined));
  const isPayActive = payFocusState !== "idle";
  const isPayClosing = payFocusState === "closing";
  const walletAssetSource = isApiMode ? (apiWalletAssets ?? emptyWalletAssets) : emptyWalletAssets;
  const payBalanceLabel = getDmcBalanceLabel(walletAssetSource);
  const recentTransactionSource = isApiMode ? (apiRecentTransactions ?? []) : recentTransactions;

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

        setApiWalletAssets(mappedWalletAssets.length > 0 ? mappedWalletAssets : emptyWalletAssets);
        setApiRecentTransactions(ledger.map(mapLedgerRecentTransaction));
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

  const refreshPayBarcode = () => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    void createCustomerPayBarcode()
      .then((barcode) => {
        if (!barcode.code) {
          return;
        }

        setPayBarcode({
          displayValue: formatPayCodeDisplay(barcode.code),
          value: `DAEMA-PAY:${barcode.code}`,
        });
      })
      .catch(() => undefined);
  };

  const openPayFocus = () => {
    if (payFocusState === "idle") {
      setPayFocusState("open");
      refreshPayBarcode();
    }
  };

  const closePayFocus = () => {
    if (payFocusState !== "idle") {
      setPayFocusState("closing");
    }
  };

  return (
    <div className="customer-pay-page">
      <AppHeader />

      <Surface
        asChild
        className={`customer-main-action customer-pay-panel${
          isPayActive ? " customer-pay-panel--focused" : ""
        }${isPayClosing ? " customer-pay-panel--closing" : ""}`}
        padding="none"
      >
        <section
          aria-expanded={isPayActive ? undefined : false}
          aria-labelledby="customer-pay-direct-title"
          aria-modal={isPayActive ? true : undefined}
          className="customer-pay-direct"
          onAnimationEnd={(event) => {
            if (event.currentTarget !== event.target) {
              return;
            }

            if (payFocusState === "closing") {
              setPayFocusState("idle");
            }
          }}
          onClick={() => {
            openPayFocus();
          }}
          onKeyDown={(event) => {
            if (isPayActive && event.key === "Escape") {
              event.preventDefault();
              closePayFocus();
              return;
            }

            if (!isPayActive && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault();
              openPayFocus();
            }
          }}
          role={isPayActive ? "dialog" : "button"}
          tabIndex={0}
        >
          <div className="customer-pay-card__header">
            <h1 className="customer-pay-card__title" id="customer-pay-direct-title">
              <BoltIcon aria-hidden="true" />
              바로 결제
            </h1>
            <div className="customer-pay-card__meta">
              <span className="customer-pay-balance">대마코인 {payBalanceLabel}</span>
              {isPayActive ? (
                <IconButton
                  aria-label="바코드 화면 닫기"
                  className="customer-pay-focus__close"
                  intent="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    closePayFocus();
                  }}
                  type="button"
                >
                  <XMarkIcon aria-hidden="true" />
                </IconButton>
              ) : null}
            </div>
          </div>

          <div className="customer-pay-code">
            <PayBarcode displayValue={payBarcode.displayValue} value={payBarcode.value} />
          </div>
        </section>
      </Surface>
      {isPayActive ? (
        <div
          aria-hidden="true"
          className={`customer-pay-flow-spacer${
            isPayClosing ? " customer-pay-flow-spacer--closing" : ""
          }`}
        />
      ) : null}

      <SinglePromoBanner banner={promoBanners[0]!} />

      <RecentTransactions href="/history" transactions={recentTransactionSource} />
    </div>
  );
}
