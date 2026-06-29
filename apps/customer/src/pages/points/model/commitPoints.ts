import type { Activity } from "react-activity-calendar";

import type { RecentTransaction } from "../../../entities/customer-home";
import type {
  CustomerCommitActivityDto,
  CustomerCommitStatDto,
  CustomerCommitTransactionDto,
} from "../../../shared/api/commits";
import {
  formatLedgerAmount,
  formatLedgerRelativeTime,
  getRecordText,
  ledgerAmountValue,
} from "../../../shared/api/customerDataMappers";

const commitPattern = [
  0, 1, 0, 2, 3, 1, 0, 2, 4, 3, 1, 0, 2, 3, 4, 2, 1, 0, 3, 4, 4, 2, 1, 0, 1, 2, 3, 2, 0, 1, 4, 3, 2,
  1, 0, 2, 3, 4, 1, 0, 2, 4, 3, 2, 1, 0, 3, 4, 2, 1, 0, 2, 3, 1, 4, 3, 2, 0, 1, 3, 4, 2, 1, 0, 2, 3,
  4, 1, 0, 2, 4, 3, 2, 1, 0, 3, 4, 4, 2, 1, 0, 2, 3, 4,
] as const;

export const ACTIVITY_DAY_COUNT = 35;

export type CommitChartDatum = {
  commits: number;
  current: boolean;
  label: string;
  period?: string;
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createCommitActivity(): Activity[] {
  const endDate = new Date("2026-06-23T00:00:00.000Z");

  return Array.from({ length: ACTIVITY_DAY_COUNT }, (_, index) => {
    const level = commitPattern[index % commitPattern.length] ?? 0;
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - (ACTIVITY_DAY_COUNT - index - 1));

    return {
      count: level === 0 ? 0 : level * 2 + (index % 3),
      date: formatDate(date),
      level,
    };
  });
}

export const commitActivity = createCommitActivity();

export const monthlyCommitData = [
  { commits: 46, current: false, label: "1월" },
  { commits: 103, current: false, label: "2월" },
  { commits: 83, current: false, label: "3월" },
  { commits: 128, current: false, label: "4월" },
  { commits: 80, current: false, label: "5월" },
  { commits: 79, current: true, label: "이번 달" },
] satisfies readonly CommitChartDatum[];

export const commitHistoryTransactions = [
  { amount: "+10 커밋", meta: "커밋 ㅣ 포인트 화면 커밋 잔디 정리", time: "오늘 12:42" },
  { amount: "+8 커밋", meta: "커밋 ㅣ 월별 커밋 차트 레이아웃 조정", time: "오늘 10:18" },
  { amount: "+6 커밋", meta: "커밋 ㅣ 부스 결제 완료 플로우 연결", time: "어제 21:07" },
  { amount: "+4 커밋", meta: "커밋 ㅣ 페이 바로결제 애니메이션 개선", time: "어제 18:33" },
] satisfies readonly RecentTransaction[];

export function clampCommitLevel(level: number): Activity["level"] {
  return Math.min(4, Math.max(0, Math.trunc(level))) as Activity["level"];
}

export function inferCommitLevel(count: number): Activity["level"] {
  if (count <= 0) {
    return 0;
  }

  if (count <= 2) {
    return 1;
  }

  if (count <= 5) {
    return 2;
  }

  if (count <= 9) {
    return 3;
  }

  return 4;
}

export function mapCommitActivityDto(activity: CustomerCommitActivityDto): Activity | undefined {
  if (!activity.date) {
    return undefined;
  }

  const count = Math.max(0, activity.count ?? 0);

  return {
    count,
    date: activity.date,
    level:
      typeof activity.level === "number"
        ? clampCommitLevel(activity.level)
        : inferCommitLevel(count),
  };
}

function getCommitStatCount(stat: CustomerCommitStatDto | undefined) {
  const count = stat?.commitCount ?? stat?.count ?? 0;

  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

function formatCommitPeriod(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function createRecentCommitMonthPeriods() {
  const current = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(current);

    date.setMonth(current.getMonth() - (5 - index), 1);

    return {
      label: `${date.getMonth() + 1}월`,
      period: formatCommitPeriod(date),
    };
  });
}

export function mapCommitStatsDtos(stats: readonly CustomerCommitStatDto[]): CommitChartDatum[] {
  if (stats.length === 0) {
    return [];
  }

  const statsByPeriod = new Map<string, CustomerCommitStatDto>();

  stats.forEach((stat) => {
    if (stat.period) {
      statsByPeriod.set(stat.period, stat);
    }
  });

  if (statsByPeriod.size === 0) {
    return stats.slice(-6).map((stat, index) => ({
      commits: getCommitStatCount(stat),
      current: stat.current ?? index === stats.length - 1,
      label: stat.label ?? `${index + 1}`,
    }));
  }

  const currentPeriod = formatCommitPeriod(new Date());

  return createRecentCommitMonthPeriods().map(({ label, period }) => {
    const stat = statsByPeriod.get(period);
    const current = stat?.current ?? period === currentPeriod;

    return {
      commits: getCommitStatCount(stat),
      current,
      label: current ? "이번 달" : (stat?.label ?? label),
      period,
    };
  });
}

function formatCommitRewardAmount(transaction: CustomerCommitTransactionDto) {
  const value = ledgerAmountValue(transaction.amount);
  const formattedAmount = formatLedgerAmount(transaction.amount);

  if (value > 0) {
    return `+${formattedAmount}`;
  }

  if (value < 0) {
    return `-${formattedAmount}`;
  }

  return formattedAmount;
}

export function mapCommitTransactionDto(
  transaction: CustomerCommitTransactionDto,
): RecentTransaction {
  const repository = getRecordText(transaction, ["repository"]);
  const title = getRecordText(transaction, ["title", "message", "description"]) ?? "커밋 리워드";
  const metaTitle = repository && title !== repository ? `${repository} · ${title}` : title;

  return {
    amount: formatCommitRewardAmount(transaction),
    meta: `커밋 ㅣ ${metaTitle}`,
    time:
      transaction.relativeTimeLabel ??
      getRecordText(transaction, ["displayTime", "time"]) ??
      formatLedgerRelativeTime(transaction.occurredAt),
  };
}
