import { customerApiRequest } from "./client";
import type { CustomerLedgerAmountDto, CustomerLedgerTransactionDto } from "./ledger";

export type CustomerCommitActivityDto = {
  count?: number;
  date: string;
  level?: number;
  rewardedPoints?: number;
};

export type CustomerCommitStatDto = {
  commitCount?: number;
  count?: number;
  current?: boolean;
  label?: string;
  period?: string;
  rewardedPoints?: number;
};

export type CustomerCommitTransactionDto = CustomerLedgerTransactionDto & {
  amount?: CustomerLedgerAmountDto;
  commitCount?: number;
  htmlUrl?: string;
  message?: string;
  relativeTimeLabel?: string;
  repository?: string;
  sha?: string;
  title?: string;
};

export type CustomerCommitRewardMilestoneDto = {
  achievedAt?: string;
  days: number;
  paidAt?: string;
  rewardAmount: number;
  status?: "earned" | "locked" | "paid";
};

export type CustomerCommitRewardSummaryDto = {
  committedToday?: boolean;
  currentStreakDays?: number;
  dailyCommitGoal?: number;
  lastCommittedAt?: string;
  longestStreakDays?: number;
  milestones?: CustomerCommitRewardMilestoneDto[];
  todayCommitCount?: number;
  totalRewardAmount?: number;
};

function formatDateQuery(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createCommitRangeSearchParams(days: number) {
  const to = new Date();
  const from = new Date(to);

  from.setDate(to.getDate() - Math.max(0, days - 1));

  const params = new URLSearchParams({
    from: formatDateQuery(from),
    to: formatDateQuery(to),
  });

  return params;
}

export async function fetchCustomerCommitActivity(days = 35) {
  const params = createCommitRangeSearchParams(days);

  return customerApiRequest<CustomerCommitActivityDto[]>(
    `/customer/points/commit-activity?${params.toString()}`,
  );
}

export async function fetchCustomerCommitStats(groupBy: "day" | "month" | "week" = "month") {
  const params = new URLSearchParams({ groupBy });

  return customerApiRequest<CustomerCommitStatDto[]>(
    `/customer/points/commit-stats?${params.toString()}`,
  );
}

export async function fetchCustomerCommitTransactions(limit = 6) {
  const params = new URLSearchParams({ limit: `${limit}` });

  return customerApiRequest<CustomerCommitTransactionDto[]>(
    `/customer/points/commit-transactions?${params.toString()}`,
  );
}

export async function fetchCustomerCommitRewardSummary() {
  return customerApiRequest<CustomerCommitRewardSummaryDto>(
    "/customer/points/commit-reward-summary",
  );
}
