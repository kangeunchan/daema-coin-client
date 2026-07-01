import { afterEach, expect, test, vi } from "vitest";

import {
  ACTIVITY_DAY_COUNT,
  commitActivity,
  inferCommitLevel,
  mapCommitActivityDto,
  mapCommitRewardSummaryDto,
  mapCommitStatsDtos,
  mapCommitTransactionDto,
} from "./commitPoints";

afterEach(() => {
  vi.useRealTimers();
});

test("creates the static commit activity window", () => {
  expect(commitActivity).toHaveLength(ACTIVITY_DAY_COUNT);
  expect(commitActivity[0]?.date).toBe("2026-05-28");
  expect(commitActivity.at(-1)?.date).toBe("2026-07-01");
  expect(commitActivity.at(-6)?.count).toBe(0);
  expect(commitActivity.slice(-5).every((item) => item.count >= 10)).toBe(true);
});

test("maps commit activity dto with clamped levels", () => {
  expect(mapCommitActivityDto({ count: 12, date: "2026-06-26", level: 8 })).toEqual({
    count: 12,
    date: "2026-06-26",
    level: 4,
  });
  expect(mapCommitActivityDto({ count: 5, date: "2026-06-26" })?.level).toBe(2);
  expect(inferCommitLevel(10)).toBe(4);
});

test("normalizes monthly commit stats around the current month", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-26T00:00:00+09:00"));

  expect(
    mapCommitStatsDtos([
      { count: 4, period: "2026-05" },
      { commitCount: 7, period: "2026-06" },
    ]),
  ).toEqual([
    { commits: 0, current: false, label: "1월", period: "2026-01" },
    { commits: 0, current: false, label: "2월", period: "2026-02" },
    { commits: 0, current: false, label: "3월", period: "2026-03" },
    { commits: 0, current: false, label: "4월", period: "2026-04" },
    { commits: 4, current: false, label: "5월", period: "2026-05" },
    { commits: 7, current: true, label: "이번 달", period: "2026-06" },
  ]);
});

test("maps commit transactions for the recent list", () => {
  expect(
    mapCommitTransactionDto({
      amount: { currency: "POINT", value: 100 },
      occurredAt: "2026-06-26T00:00:00+09:00",
      repository: "daema",
      title: "refactor points",
    }),
  ).toMatchObject({
    amount: "+100 P",
    meta: "커밋 ㅣ daema · refactor points",
  });
});

test("maps commit reward milestones with API status and inferred defaults", () => {
  expect(
    mapCommitRewardSummaryDto({
      committedToday: true,
      currentStreakDays: 8,
      dailyCommitGoal: 10,
      longestStreakDays: 12,
      milestones: [
        { days: 7, rewardAmount: 5_000, status: "paid" },
        { days: 14, rewardAmount: 15_000 },
      ],
      todayCommitCount: 10,
      totalRewardAmount: 5_000,
    }),
  ).toEqual({
    committedToday: true,
    currentStreakDays: 8,
    dailyCommitGoal: 10,
    longestStreakDays: 12,
    milestones: [
      {
        days: 7,
        rewardAmount: 5_000,
        status: "paid",
      },
      {
        days: 14,
        rewardAmount: 15_000,
        status: "locked",
      },
    ],
    todayCommitCount: 10,
    totalRewardAmount: 5_000,
  });
});

test("does not qualify a day below the 10 commit goal", () => {
  expect(
    mapCommitRewardSummaryDto({
      committedToday: true,
      currentStreakDays: 4,
      dailyCommitGoal: 10,
      todayCommitCount: 9,
    }).committedToday,
  ).toBe(false);
});
