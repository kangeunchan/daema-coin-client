import type { RankingEntry, RecentTransaction, WalletAsset } from "../../entities/customer-home";
import type { CustomerLedgerAmountDto, CustomerLedgerTransactionDto } from "./ledger";
import type { CustomerRankingDto } from "./rankings";
import type { CustomerWalletBalanceDto } from "./wallet";

export const emptyWalletAssets = [
  { label: "대마코인", value: "0 DMC" },
  { label: "대마포인트", value: "0 P" },
] satisfies readonly WalletAsset[];

export function ledgerAmountValue(amount: CustomerLedgerAmountDto | number | unknown) {
  if (typeof amount === "number") {
    return amount;
  }

  if (amount && typeof amount === "object" && "value" in amount) {
    const value = (amount as CustomerLedgerAmountDto).value;

    return typeof value === "number" ? value : 0;
  }

  return 0;
}

export function ledgerAmountCurrency(amount: CustomerLedgerAmountDto | number | unknown) {
  if (amount && typeof amount === "object" && "currency" in amount) {
    const currency = (amount as CustomerLedgerAmountDto).currency;

    if (typeof currency === "string" && currency.length > 0) {
      return currency;
    }
  }

  return "DMC";
}

export function formatLedgerAmount(amount: CustomerLedgerAmountDto | number | unknown) {
  if (amount && typeof amount === "object" && "formatted" in amount) {
    const formatted = (amount as CustomerLedgerAmountDto).formatted;

    if (typeof formatted === "string" && formatted.length > 0) {
      return formatted;
    }
  }

  const value = ledgerAmountValue(amount);
  const currency = ledgerAmountCurrency(amount);
  const suffix = currency === "POINT" ? "P" : currency;

  return `${Math.abs(value).toLocaleString("ko-KR")} ${suffix}`;
}

export function getLedgerRecordAmount(transaction: CustomerLedgerTransactionDto) {
  return (
    ledgerAmountValue(transaction.totalAmount) ||
    ledgerAmountValue(transaction.amount) ||
    ledgerAmountValue(transaction.price) ||
    ledgerAmountValue(transaction.unitAmount)
  );
}

export function getRecordText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return undefined;
}

export function formatLedgerRelativeTime(occurredAt: string | undefined) {
  if (!occurredAt) {
    return "방금 전";
  }

  const timestamp = new Date(occurredAt).getTime();

  if (Number.isNaN(timestamp)) {
    return occurredAt;
  }

  const diffMs = Date.now() - timestamp;
  const diffHours = Math.max(0, Math.floor(diffMs / 1000 / 60 / 60));

  if (diffHours < 1) {
    return "방금 전";
  }

  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return `${Math.floor(diffHours / 24)}일 전`;
}

export function mapWalletAsset(balance: CustomerWalletBalanceDto): WalletAsset | undefined {
  const amount = balance.balance ?? balance.amount;
  const label = balance.label ?? balance.name ?? balance.currency;

  if (!amount || !label) {
    return undefined;
  }

  return {
    label,
    value: formatLedgerAmount(amount),
  };
}

export function mapLedgerRecentTransaction(
  transaction: CustomerLedgerTransactionDto,
): RecentTransaction {
  const direction = transaction.direction === "income" ? "적립" : "사용";
  const amount = getLedgerRecordAmount(transaction);
  const label =
    getRecordText(transaction, ["title", "label", "description", "categoryLabel", "type"]) ??
    "거래 내역";
  const unsignedAmount =
    transaction.amount && typeof transaction.amount === "object"
      ? formatLedgerAmount(transaction.amount)
      : `${Math.abs(amount).toLocaleString("ko-KR")} DMC`;
  const sign = amount === 0 ? "" : transaction.direction === "income" ? "+" : "-";

  return {
    amount: `${sign}${unsignedAmount}`,
    meta: `${direction} ㅣ ${label}`,
    time:
      getRecordText(transaction, ["displayTime", "time"]) ??
      formatLedgerRelativeTime(transaction.occurredAt),
  };
}

const rankingTones = ["#f59e0b", "#64748b", "#10b981"] as const;

export function mapCustomerRankingEntry(
  item: CustomerRankingDto,
  index: number,
): RankingEntry | undefined {
  const rank = typeof item.rank === "number" && item.rank > 0 ? item.rank : index + 1;
  const name =
    getRecordText(item, ["name", "displayName", "customerName", "studentName", "githubLogin"]) ??
    `사용자 ${rank}`;
  const points =
    ledgerAmountValue(item.points) ||
    ledgerAmountValue(item.totalPoint) ||
    ledgerAmountValue(item.score) ||
    ledgerAmountValue(item.balance) ||
    ledgerAmountValue(item.amount);

  if (points <= 0) {
    return undefined;
  }

  const rankingEntry: RankingEntry = {
    name,
    points,
    rank,
    tone: rankingTones[Math.min(rank, rankingTones.length) - 1] ?? "#64748b",
  };

  if (typeof item.avatarUrl === "string" && item.avatarUrl.length > 0) {
    rankingEntry.avatarUrl = item.avatarUrl;
  }

  return rankingEntry;
}
