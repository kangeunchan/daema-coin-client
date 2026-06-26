import { useEffect, useRef, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity } from "react-activity-calendar";
import { AR, AT, DZ, FR, IQ, JO, KR, MX, NO, SN } from "country-flag-icons/react/3x2";
import { Skeleton } from "@daema/ui/skeleton";
import { Surface } from "@daema/ui/surface";
import SoccerLineUp from "react-soccer-lineup";
import type { Team as SoccerLineupTeam } from "react-soccer-lineup";
import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts";

import type { RecentTransaction } from "../../entities/customer-home";
import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  fetchCustomerCommitActivity,
  fetchCustomerCommitStats,
  fetchCustomerCommitTransactions,
} from "../../shared/api/commits";
import type {
  CustomerCommitActivityDto,
  CustomerCommitStatDto,
  CustomerCommitTransactionDto,
} from "../../shared/api/commits";
import {
  formatLedgerAmount,
  formatLedgerRelativeTime,
  getRecordText,
  ledgerAmountValue,
} from "../../shared/api/customerDataMappers";
import {
  cancelCustomerWorldcupPrediction,
  createCustomerWorldcupPrediction,
  fetchCustomerWorldcupLineups,
  fetchCustomerWorldcupMatchDays,
  fetchCustomerWorldcupPredictionSummary,
  fetchCustomerWorldcupStats,
} from "../../shared/api/worldcup";
import type {
  CustomerWorldcupLineupDto,
  CustomerWorldcupLineupPlayerDto,
  CustomerWorldcupMatchDayDto,
  CustomerWorldcupMatchMetricDto,
  CustomerWorldcupMatchDto,
  CustomerWorldcupPredictionPick,
} from "../../shared/api/worldcup";
import { AppHeader } from "../../widgets/app-header";
import { RecentTransactions } from "../../widgets/recent-transactions";

const commitPattern = [
  0, 1, 0, 2, 3, 1, 0, 2, 4, 3, 1, 0, 2, 3, 4, 2, 1, 0, 3, 4, 4, 2, 1, 0, 1, 2, 3, 2, 0, 1, 4, 3, 2,
  1, 0, 2, 3, 4, 1, 0, 2, 4, 3, 2, 1, 0, 3, 4, 2, 1, 0, 2, 3, 1, 4, 3, 2, 0, 1, 3, 4, 2, 1, 0, 2, 3,
  4, 1, 0, 2, 4, 3, 2, 1, 0, 3, 4, 4, 2, 1, 0, 2, 3, 4,
] as const;

const ACTIVITY_DAY_COUNT = 35;

type CommitChartDatum = {
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

const commitActivity = createCommitActivity();
const monthlyCommitData = [
  { commits: 46, current: false, label: "1월" },
  { commits: 103, current: false, label: "2월" },
  { commits: 83, current: false, label: "3월" },
  { commits: 128, current: false, label: "4월" },
  { commits: 80, current: false, label: "5월" },
  { commits: 79, current: true, label: "이번 달" },
] satisfies readonly CommitChartDatum[];

const commitHistoryTransactions = [
  { amount: "+10 커밋", meta: "커밋 ㅣ 포인트 화면 커밋 잔디 정리", time: "오늘 12:42" },
  { amount: "+8 커밋", meta: "커밋 ㅣ 월별 커밋 차트 레이아웃 조정", time: "오늘 10:18" },
  { amount: "+6 커밋", meta: "커밋 ㅣ 부스 결제 완료 플로우 연결", time: "어제 21:07" },
  { amount: "+4 커밋", meta: "커밋 ㅣ 페이 바로결제 애니메이션 개선", time: "어제 18:33" },
] satisfies readonly RecentTransaction[];

type WorldcupTeam = {
  countryCode: string;
  id?: string;
  logo?: string;
  name: string;
  score?: number;
};

type WorldcupMatch = {
  away: WorldcupTeam;
  home: WorldcupTeam;
  id?: string;
  startsAt?: string;
  status: "예정" | "진행중" | "종료";
  subtitle: string;
  time?: string;
};

type WorldcupMatchDay = {
  badge?: string;
  date: string;
  id?: string;
  isActive?: boolean;
  label: string;
  matches: readonly WorldcupMatch[];
};

type WorldcupMatchTimeGroup = {
  matches: WorldcupMatch[];
  timeLabel?: string;
};

type WorldcupMatchDetail = {
  day: WorldcupMatchDay;
  match: WorldcupMatch;
  matchId: string;
};

type WorldcupPredictionStats = {
  away: number;
  draw: number;
  home: number;
};

type WorldcupMatchMetric = {
  away: number;
  awayDisplay?: string;
  home: number;
  homeDisplay?: string;
  label: string;
};

type WorldcupPlayer = {
  name: string;
  number: number;
  position: string;
  rating: number;
  x: number;
  y: number;
};

type WorldcupPlayerSeed =
  | string
  | {
      name: string;
      number?: number;
      position?: string;
      rating?: number;
    };

type WorldcupStaticFlagCode = keyof typeof worldcupFlagIcons;

type WorldcupTeamLineupSource = {
  coach: string;
  formation: string;
  players: readonly WorldcupPlayerSeed[];
};

type WorldcupTeamLineup = {
  coach: string;
  formation: string;
  players: readonly WorldcupPlayer[];
};

type WorldcupSoccerLineRole = Exclude<keyof SoccerLineupTeam["squad"], "gk">;
type WorldcupSoccerPlayer = NonNullable<SoccerLineupTeam["squad"]["gk"]>;

const worldcupFlagIcons = {
  AR,
  AT,
  DZ,
  FR,
  IQ,
  JO,
  KR,
  MX,
  NO,
  SN,
} satisfies Record<string, typeof KR>;

const worldcupMatchDays: readonly WorldcupMatchDay[] = [
  {
    date: "6.23",
    label: "화",
    matches: [
      {
        away: { countryCode: "AT", name: "오스트리아", score: 0 },
        home: { countryCode: "AR", name: "아르헨티나", score: 2 },
        status: "종료",
        subtitle: "J조 예선",
      },
      {
        away: { countryCode: "IQ", name: "이라크", score: 0 },
        home: { countryCode: "FR", name: "프랑스", score: 3 },
        status: "종료",
        subtitle: "I조 예선",
      },
      {
        away: { countryCode: "SN", name: "세네갈", score: 2 },
        home: { countryCode: "NO", name: "노르웨이", score: 3 },
        status: "종료",
        subtitle: "I조 예선",
      },
      {
        away: { countryCode: "DZ", name: "알제리", score: 2 },
        home: { countryCode: "JO", name: "요르단", score: 1 },
        status: "종료",
        subtitle: "J조 예선",
      },
    ],
  },
  {
    badge: "대한민국",
    date: "6.25",
    label: "목",
    matches: [
      {
        away: { countryCode: "MX", name: "멕시코" },
        home: { countryCode: "KR", name: "대한민국" },
        status: "예정",
        subtitle: "응원전",
        time: "20:00",
      },
    ],
  },
  {
    date: "6.26",
    label: "금",
    matches: [
      {
        away: { countryCode: "FR", name: "프랑스" },
        home: { countryCode: "NO", name: "노르웨이" },
        status: "예정",
        subtitle: "I조 예선",
        time: "03:00",
      },
      {
        away: { countryCode: "IQ", name: "이라크" },
        home: { countryCode: "SN", name: "세네갈" },
        status: "예정",
        subtitle: "I조 예선",
        time: "03:00",
      },
    ],
  },
  {
    date: "6.27",
    label: "토",
    matches: [
      {
        away: { countryCode: "AT", name: "오스트리아" },
        home: { countryCode: "DZ", name: "알제리" },
        status: "예정",
        subtitle: "J조 예선",
        time: "10:00",
      },
      {
        away: { countryCode: "AR", name: "아르헨티나" },
        home: { countryCode: "JO", name: "요르단" },
        status: "예정",
        subtitle: "J조 예선",
        time: "10:00",
      },
    ],
  },
];

const worldcupLineups: Partial<Record<WorldcupStaticFlagCode, WorldcupTeamLineupSource>> = {
  KR: {
    coach: "홍명보",
    formation: "4-3-3",
    players: [
      { name: "조현우", number: 1, rating: 6.7 },
      { name: "설영우", number: 2, rating: 6.6 },
      { name: "김민재", number: 4, rating: 7.1 },
      { name: "정승현", number: 15, rating: 6.5 },
      { name: "김문환", number: 23, rating: 6.4 },
      { name: "황인범", number: 6, rating: 7.0 },
      { name: "이강인", number: 18, rating: 7.3 },
      { name: "정우영", number: 5, rating: 6.4 },
      { name: "손흥민", number: 7, rating: 7.5 },
      { name: "황희찬", number: 11, rating: 6.9 },
      { name: "조규성", number: 9, rating: 6.6 },
    ],
  },
  MX: {
    coach: "하비에르 아기레",
    formation: "4-2-3-1",
    players: [
      { name: "오초아", number: 13, rating: 6.8 },
      { name: "아라우호", number: 2, rating: 6.3 },
      { name: "몬테스", number: 3, rating: 6.5 },
      { name: "바스케스", number: 5, rating: 6.4 },
      { name: "갈라도", number: 23, rating: 6.2 },
      { name: "알바레스", number: 4, rating: 6.9 },
      { name: "차베스", number: 24, rating: 6.7 },
      { name: "피네다", number: 18, rating: 6.5 },
      { name: "기메네스", number: 11, rating: 6.8 },
      { name: "로사노", number: 22, rating: 7.0 },
      { name: "마르틴", number: 20, rating: 6.6 },
    ],
  },
};

const worldcupPredictionStats: Record<string, WorldcupPredictionStats> = {
  "623-ar-at": { away: 8, draw: 13, home: 79 },
  "623-fr-iq": { away: 9, draw: 15, home: 76 },
  "623-no-sn": { away: 36, draw: 20, home: 44 },
  "623-jo-dz": { away: 52, draw: 24, home: 24 },
  "625-kr-mx": { away: 20, draw: 24, home: 56 },
  "626-no-fr": { away: 48, draw: 22, home: 30 },
  "626-sn-iq": { away: 28, draw: 25, home: 47 },
  "627-dz-at": { away: 32, draw: 23, home: 45 },
  "627-jo-ar": { away: 68, draw: 18, home: 14 },
};

const worldcupPredictionStakeAmounts: Record<string, number> = {
  "623-ar-at": 184200,
  "623-fr-iq": 137600,
  "623-no-sn": 129400,
  "623-jo-dz": 116800,
  "625-kr-mx": 248500,
  "626-no-fr": 193200,
  "626-sn-iq": 178900,
  "627-dz-at": 142700,
  "627-jo-ar": 156300,
};

const worldcupMatchMetrics = [
  { away: 44, awayDisplay: "44%", home: 56, homeDisplay: "56%", label: "볼점유율" },
  { away: 11, home: 14, label: "슈팅" },
  { away: 4, home: 5, label: "유효슈팅" },
  { away: 418, home: 532, label: "패스시도" },
  { away: 344, home: 462, label: "패스성공" },
  { away: 9, home: 12, label: "키패스" },
  { away: 5, home: 6, label: "코너킥" },
  { away: 12, home: 10, label: "프리킥" },
  { away: 2, home: 1, label: "오프사이드" },
  { away: 4, home: 3, label: "선방" },
  { away: 8, home: 9, label: "골킥" },
  { away: 4, home: 4, label: "선수교체" },
  { away: 13, home: 11, label: "파울" },
  { away: 2, home: 1, label: "경고" },
  { away: 0, home: 0, label: "퇴장" },
  { away: 1.08, home: 1.36, label: "기대득점" },
] satisfies readonly WorldcupMatchMetric[];

function clampCommitLevel(level: number): Activity["level"] {
  return Math.min(4, Math.max(0, Math.trunc(level))) as Activity["level"];
}

function inferCommitLevel(count: number): Activity["level"] {
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

function mapCommitActivityDto(activity: CustomerCommitActivityDto): Activity | undefined {
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

function mapCommitStatsDtos(stats: readonly CustomerCommitStatDto[]): CommitChartDatum[] {
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

function mapCommitTransactionDto(transaction: CustomerCommitTransactionDto): RecentTransaction {
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

function normalizeWorldcupStatus(status: string, statusLabel?: string): WorldcupMatch["status"] {
  if (statusLabel === "예정" || statusLabel === "진행중" || statusLabel === "종료") {
    return statusLabel;
  }

  switch (status) {
    case "finished":
      return "종료";
    case "live":
      return "진행중";
    case "scheduled":
    default:
      return "예정";
  }
}

function mapWorldcupTeamDto(team: CustomerWorldcupMatchDto["home"]): WorldcupTeam {
  const mappedTeam: WorldcupTeam = {
    countryCode: team.countryCode ?? "",
    name: team.name,
  };

  if (team.id) {
    mappedTeam.id = team.id;
  }

  if (team.logo) {
    mappedTeam.logo = team.logo;
  }

  if (typeof team.score === "number") {
    mappedTeam.score = team.score;
  }

  return mappedTeam;
}

function mapWorldcupMatchDto(match: CustomerWorldcupMatchDto): WorldcupMatch {
  const mappedMatch: WorldcupMatch = {
    away: mapWorldcupTeamDto(match.away),
    home: mapWorldcupTeamDto(match.home),
    id: match.id,
    status: normalizeWorldcupStatus(match.status, match.statusLabel),
    subtitle: match.subtitle ?? "경기",
  };

  if (match.startsAt) {
    mappedMatch.startsAt = match.startsAt;
  }

  if (match.displayTime) {
    mappedMatch.time = match.displayTime;
  }

  return mappedMatch;
}

function mapWorldcupMatchDayDto(day: CustomerWorldcupMatchDayDto): WorldcupMatchDay {
  const mappedDay: WorldcupMatchDay = {
    date: day.date,
    id: day.id,
    label: day.label,
    matches: day.matches.map(mapWorldcupMatchDto),
  };

  if (day.badge) {
    mappedDay.badge = day.badge;
  }

  if (day.isActive !== undefined) {
    mappedDay.isActive = day.isActive;
  }

  return mappedDay;
}

function mapWorldcupMetricDto(metric: CustomerWorldcupMatchMetricDto): WorldcupMatchMetric {
  const mappedMetric: WorldcupMatchMetric = {
    away: metric.away,
    home: metric.home,
    label: metric.label,
  };

  if (metric.awayDisplay) {
    mappedMetric.awayDisplay = metric.awayDisplay;
  }

  if (metric.homeDisplay) {
    mappedMetric.homeDisplay = metric.homeDisplay;
  }

  return mappedMetric;
}

function inferWorldcupFormationFromPlayers(players: readonly CustomerWorldcupLineupPlayerDto[]) {
  const defenderCount = players.filter((player) => player.position === "D").length;
  const midfielderCount = players.filter((player) => player.position === "M").length;
  const forwardCount = players.filter((player) => player.position === "F").length;

  if (defenderCount + midfielderCount + forwardCount === 10) {
    return `${defenderCount}-${midfielderCount}-${forwardCount}`;
  }

  return "4-3-3";
}

function mapWorldcupLineupDto(lineup: CustomerWorldcupLineupDto | undefined) {
  if (!lineup?.players?.length) {
    return undefined;
  }

  const formation = lineup.formation || inferWorldcupFormationFromPlayers(lineup.players);

  return {
    coach: lineup.coach || "대표팀 감독",
    formation,
    players: buildWorldcupPlayersFromFormation(
      formation,
      lineup.players.map((player) => {
        const seed: Exclude<WorldcupPlayerSeed, string> = {
          name: player.name,
        };

        if (player.number !== undefined) {
          seed.number = player.number;
        }

        if (player.position) {
          seed.position = player.position;
        }

        return seed;
      }),
    ),
  } satisfies WorldcupTeamLineup;
}

function groupWorldcupMatchesByTime(matches: readonly WorldcupMatch[]): WorldcupMatchTimeGroup[] {
  const groups = new Map<string, WorldcupMatch[]>();

  matches.forEach((match) => {
    const timeKey = match.time ?? "without-time";
    const group = groups.get(timeKey) ?? [];
    group.push(match);
    groups.set(timeKey, group);
  });

  return Array.from(groups, ([timeKey, groupedMatches]) => {
    if (timeKey === "without-time") {
      return { matches: groupedMatches };
    }

    return {
      matches: groupedMatches,
      timeLabel: timeKey,
    };
  });
}

function getWorldcupDayKey(day: WorldcupMatchDay) {
  return day.id ?? day.date;
}

function getTodayWorldcupDayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWorldcupDaySortValue(day: WorldcupMatchDay) {
  const dayKey = getWorldcupDayKey(day);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
    return dayKey;
  }

  const firstStartsAt = day.matches.find((match) => match.startsAt)?.startsAt;

  if (firstStartsAt) {
    const startsAtDate = firstStartsAt.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

    if (startsAtDate) {
      return startsAtDate;
    }

    const timestamp = Date.parse(firstStartsAt);

    if (!Number.isNaN(timestamp)) {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const dayOfMonth = `${date.getDate()}`.padStart(2, "0");

      return `${year}-${month}-${dayOfMonth}`;
    }
  }

  const dateParts = day.date.match(/^(\d{1,2})\.(\d{1,2})$/);

  if (dateParts) {
    const [, month = "1", date = "1"] = dateParts;
    const year = new Date().getFullYear();

    return `${year}-${month.padStart(2, "0")}-${date.padStart(2, "0")}`;
  }

  return dayKey;
}

function hasKoreaWorldcupMatch(day: WorldcupMatchDay) {
  return day.matches.some(
    (match) => match.home.countryCode === "KR" || match.away.countryCode === "KR",
  );
}

function normalizeWorldcupMatchDay(day: WorldcupMatchDay): WorldcupMatchDay {
  const todayKey = getTodayWorldcupDayKey();
  const dayKey = getWorldcupDayKey(day);
  const daySortValue = getWorldcupDaySortValue(day);
  const isToday = dayKey === todayKey || daySortValue === todayKey;
  const koreaBadge = hasKoreaWorldcupMatch(day) ? "대한민국" : undefined;
  const normalizedDay: WorldcupMatchDay = {
    ...day,
    isActive: isToday,
    label: isToday ? "오늘" : day.label,
  };

  if (koreaBadge) {
    normalizedDay.badge = koreaBadge;
  } else {
    delete normalizedDay.badge;
  }

  return normalizedDay;
}

function normalizeWorldcupMatchDays(matchDays: readonly WorldcupMatchDay[]) {
  if (matchDays.length === 0) {
    return [];
  }

  const normalized = matchDays
    .map(normalizeWorldcupMatchDay)
    .sort((left, right) => getWorldcupDaySortValue(left).localeCompare(getWorldcupDaySortValue(right)));
  const hasActiveDay = normalized.some((day) => day.isActive);

  if (hasActiveDay) {
    return normalized;
  }

  const todayKey = getTodayWorldcupDayKey();
  const nextDayIndex = normalized.findIndex((day) => getWorldcupDaySortValue(day) >= todayKey);
  const activeIndex = nextDayIndex >= 0 ? nextDayIndex : normalized.length - 1;

  return normalized.map((day, index) => ({
    ...day,
    isActive: index === activeIndex,
  }));
}

function getWorldcupMatchId(day: WorldcupMatchDay, match: WorldcupMatch) {
  if (match.id) {
    return match.id;
  }

  return `${day.date.replace(".", "")}-${match.home.countryCode}-${match.away.countryCode}`.toLowerCase();
}

function getWorldcupMatchDetail(
  pathname: string,
  matchDays: readonly WorldcupMatchDay[] = worldcupMatchDays,
): WorldcupMatchDetail | undefined {
  const matchId = pathname.replace(/^\/points\/worldcup\/?/, "");

  if (!matchId || matchId === pathname) {
    return undefined;
  }

  for (const day of matchDays) {
    for (const match of day.matches) {
      const currentMatchId = getWorldcupMatchId(day, match);

      if (currentMatchId === matchId) {
        return {
          day,
          match,
          matchId: currentMatchId,
        };
      }
    }
  }

  return undefined;
}

function getWorldcupLineup(team: WorldcupTeam): WorldcupTeamLineup {
  const lineup =
    worldcupLineups[team.countryCode as WorldcupStaticFlagCode] ??
    ({
      coach: "대표팀 감독",
      formation: "4-3-3",
      players: Array.from({ length: 11 }, (_, index) => ({
        name: `${team.name} ${index + 1}`,
        number: index + 1,
      })),
    } satisfies WorldcupTeamLineupSource);

  return {
    coach: lineup.coach,
    formation: lineup.formation,
    players: buildWorldcupPlayersFromFormation(lineup.formation, lineup.players),
  };
}

function getEmptyWorldcupLineup(): WorldcupTeamLineup {
  return {
    coach: "-",
    formation: "-",
    players: [],
  };
}

function parseWorldcupFormation(formation: string) {
  const rows = formation
    .split("-")
    .map((segment) => Number.parseInt(segment, 10))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (rows.reduce((sum, value) => sum + value, 0) !== 10) {
    return [4, 3, 3];
  }

  return rows;
}

function getWorldcupFormationRole(rowIndex: number, rowCount: number) {
  if (rowIndex === 0) {
    return "DF";
  }

  if (rowIndex === rowCount - 1) {
    return "FW";
  }

  return "MF";
}

function normalizeWorldcupPlayerSeed(seed: WorldcupPlayerSeed | undefined, index: number) {
  if (typeof seed === "string") {
    return {
      name: seed,
      number: index + 1,
      rating: Number((6 + ((index * 7) % 14) / 10).toFixed(1)),
    };
  }

  return {
    name: seed?.name ?? `선수 ${index + 1}`,
    number: seed?.number ?? index + 1,
    rating: seed?.rating ?? Number((6 + ((index * 7) % 14) / 10).toFixed(1)),
  };
}

function buildWorldcupPlayersFromFormation(
  formation: string,
  players: readonly WorldcupPlayerSeed[],
): WorldcupPlayer[] {
  const rows = parseWorldcupFormation(formation);
  const lineupPlayers: WorldcupPlayer[] = [];
  const goalkeeper = normalizeWorldcupPlayerSeed(players[0], 0);
  let playerIndex = 1;

  lineupPlayers.push({
    ...goalkeeper,
    position: "GK",
    x: 50,
    y: 88,
  });

  rows.forEach((count, rowIndex) => {
    const role = getWorldcupFormationRole(rowIndex, rows.length);
    const y = rows.length === 1 ? 42 : 70 - (rowIndex * 48) / Math.max(1, rows.length - 1);

    Array.from({ length: count }, (_, rowPlayerIndex) => {
      const seed = normalizeWorldcupPlayerSeed(players[playerIndex], playerIndex);
      const x = count === 1 ? 50 : 14 + (rowPlayerIndex * 72) / Math.max(1, count - 1);

      lineupPlayers.push({
        ...seed,
        position: role,
        x,
        y,
      });

      playerIndex += 1;
    });
  });

  return lineupPlayers.slice(0, 11);
}

function getWorldcupSquadRole(
  formationRows: readonly number[],
  rowIndex: number,
): WorldcupSoccerLineRole {
  if (rowIndex === 0) {
    return "df";
  }

  if (rowIndex === formationRows.length - 1) {
    return "fw";
  }

  if (formationRows.length >= 4 && rowIndex === 1) {
    return "cdm";
  }

  if (formationRows.length >= 4 && rowIndex === formationRows.length - 2) {
    return "cam";
  }

  return "cm";
}

function buildSoccerLineupTeam(
  lineup: WorldcupTeamLineup,
  side: "away" | "home",
): SoccerLineupTeam {
  const rows = parseWorldcupFormation(lineup.formation);
  const squad: SoccerLineupTeam["squad"] = {};
  let playerIndex = 1;

  squad.gk = buildSoccerLineupPlayer(lineup.players[0]);

  rows.forEach((count, rowIndex) => {
    const role = getWorldcupSquadRole(rows, rowIndex);
    const rowPlayers = lineup.players
      .slice(playerIndex, playerIndex + count)
      .map((player) => buildSoccerLineupPlayer(player));

    squad[role] = rowPlayers;
    playerIndex += count;
  });

  return {
    squad,
    style: {
      borderColor: side === "home" ? "#ffffff" : "#111827",
      color: side === "home" ? "#ffffff" : "#111827",
      nameBackgroundColor: "rgb(15 23 42 / 0.72)",
      nameColor: "#ffffff",
      nameOverflow: "ellipsis",
      nameSize: 10,
      numberBackgroundColor: side === "home" ? "#ffffff" : "#111827",
      numberColor: side === "home" ? "#111827" : "#ffffff",
      numberSize: 12,
      size: 30,
    },
  };
}

function buildSoccerLineupPlayer(player: WorldcupPlayer | undefined): WorldcupSoccerPlayer {
  const soccerPlayer: WorldcupSoccerPlayer = {};

  if (player?.name) {
    soccerPlayer.name = player.name;
  }

  if (typeof player?.number === "number") {
    soccerPlayer.number = player.number;
  }

  return soccerPlayer;
}

function getWorldcupPredictionStats(matchId: string): WorldcupPredictionStats {
  return worldcupPredictionStats[matchId] ?? { away: 30, draw: 24, home: 46 };
}

function getWorldcupPredictionStakeAmount(matchId: string) {
  return worldcupPredictionStakeAmounts[matchId] ?? 0;
}

function pushCustomerPath(pathname: string) {
  if (window.location.pathname !== pathname) {
    window.history.pushState(
      { customerPageId: "points", customerPointTabId: "worldcup" },
      "",
      pathname,
    );
    window.dispatchEvent(new Event("popstate"));
  }
}

type CommitBarLabelProps = {
  data?: readonly CommitChartDatum[];
  height?: number | string;
  index?: number;
  value?: number | string;
  width?: number | string;
  x?: number | string;
  y?: number | string;
};

type CustomerPointsPageProps = {
  activeTabId: "daily" | "worldcup";
};

function CommitBarLabel({
  data = monthlyCommitData,
  index = 0,
  value,
  width = 0,
  x = 0,
  y = 0,
}: CommitBarLabelProps) {
  const centerX = Number(x) + Number(width) / 2;
  const labelY = Math.max(18, Number(y) - 12);
  const isCurrent = data[index]?.current;

  return (
    <text
      className="customer-points-month-chart__label"
      fill={isCurrent ? "#22a852" : "#94a3b8"}
      textAnchor="middle"
      x={centerX}
      y={labelY}
    >
      <tspan x={centerX}>{value}</tspan>
    </text>
  );
}

export function CustomerPointsPage({ activeTabId }: CustomerPointsPageProps) {
  const isApiMode = isCustomerApiEnabled();
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [apiWorldcupMatchDays, setApiWorldcupMatchDays] = useState<WorldcupMatchDay[] | undefined>(
    () => (isApiMode ? [] : undefined),
  );
  const [apiCommitActivity, setApiCommitActivity] = useState<Activity[] | undefined>(() =>
    isApiMode ? [] : undefined,
  );
  const [apiCommitStats, setApiCommitStats] = useState<CommitChartDatum[] | undefined>(() =>
    isApiMode ? [] : undefined,
  );
  const [apiCommitTransactions, setApiCommitTransactions] = useState<
    RecentTransaction[] | undefined
  >(() => (isApiMode ? [] : undefined));
  const [isWorldcupLoading, setIsWorldcupLoading] = useState(isApiMode);
  const [isCommitLoading, setIsCommitLoading] = useState(isApiMode);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void fetchCustomerWorldcupMatchDays()
      .then((matchDays) => {
        if (!isCancelled) {
          setApiWorldcupMatchDays(
            normalizeWorldcupMatchDays(matchDays.map(mapWorldcupMatchDayDto)),
          );
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setApiWorldcupMatchDays([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsWorldcupLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isApiMode) {
      return;
    }

    let isCancelled = false;

    void Promise.all([
      fetchCustomerCommitActivity(ACTIVITY_DAY_COUNT)
        .then((activity) => {
          if (!isCancelled) {
            setApiCommitActivity(
              activity
                .map(mapCommitActivityDto)
                .filter((item): item is Activity => item !== undefined),
            );
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setApiCommitActivity([]);
          }
        }),
      fetchCustomerCommitStats("month")
        .then((stats) => {
          if (!isCancelled) {
            setApiCommitStats(mapCommitStatsDtos(stats));
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setApiCommitStats([]);
          }
        }),
      fetchCustomerCommitTransactions(6)
        .then((transactions) => {
          if (!isCancelled) {
            setApiCommitTransactions(transactions.map(mapCommitTransactionDto));
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setApiCommitTransactions([]);
          }
        }),
    ]).finally(() => {
      if (!isCancelled) {
        setIsCommitLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isApiMode]);

  const worldcupMatchDaySource = isApiMode
    ? (apiWorldcupMatchDays ?? [])
    : normalizeWorldcupMatchDays(worldcupMatchDays);
  const commitActivitySource = isApiMode ? (apiCommitActivity ?? []) : commitActivity;
  const monthlyCommitDataSource = isApiMode ? (apiCommitStats ?? []) : monthlyCommitData;
  const commitTransactionsSource = isApiMode
    ? (apiCommitTransactions ?? [])
    : commitHistoryTransactions;
  const isWorldcupPath =
    pathname === "/points/worldcup" || pathname.startsWith("/points/worldcup/");
  const effectiveActiveTabId = isWorldcupPath ? "worldcup" : activeTabId;
  const selectedWorldcupMatch =
    effectiveActiveTabId === "worldcup"
      ? (getWorldcupMatchDetail(pathname, worldcupMatchDaySource) ??
        (isApiMode ? undefined : getWorldcupMatchDetail(pathname, worldcupMatchDays)))
      : undefined;

  return (
    <>
      <AppHeader />

      <main className="customer-points-page" aria-label="커밋 잔디">
        {effectiveActiveTabId === "daily" ? (
          isCommitLoading ? (
            <DailyCommitLoadingContent />
          ) : (
            <DailyCommitContent
              activity={commitActivitySource}
              chartData={monthlyCommitDataSource}
              transactions={commitTransactionsSource}
            />
          )
        ) : null}
        {effectiveActiveTabId === "worldcup" && selectedWorldcupMatch ? (
          <WorldcupMatchDetailContent
            detail={selectedWorldcupMatch}
            key={selectedWorldcupMatch.matchId}
          />
        ) : null}
        {effectiveActiveTabId === "worldcup" && !selectedWorldcupMatch ? (
          isWorldcupLoading ? (
            <WorldcupPointLoadingContent />
          ) : (
            <WorldcupPointContent matchDays={worldcupMatchDaySource} />
          )
        ) : null}
      </main>
    </>
  );
}

function DailyCommitLoadingContent() {
  return (
    <>
      <Surface asChild className="customer-points-calendar-card" padding="none">
        <section aria-label="커밋 활동 불러오는 중" aria-busy="true">
          <div className="customer-points-loading-card customer-points-loading-card--calendar">
            {Array.from({ length: 35 }, (_, index) => (
              <Skeleton
                aria-hidden="true"
                className="customer-points-loading-card__grass"
                key={index}
                shape="block"
              />
            ))}
          </div>
        </section>
      </Surface>

      <Surface asChild className="customer-points-month-tabs-card" padding="none">
        <section aria-label="커밋 차트 범위 불러오는 중" aria-busy="true">
          <div className="customer-points-month-tabs">
            {["월별", "주별", "일별"].map((label) => (
              <Skeleton
                aria-label={`${label} 탭 불러오는 중`}
                className="customer-points-loading-card__tab"
                key={label}
                shape="block"
              />
            ))}
          </div>
        </section>
      </Surface>

      <Surface asChild className="customer-points-month-card" padding="none">
        <section aria-label="커밋 통계 불러오는 중" aria-busy="true">
          <div className="customer-points-loading-chart">
            {[46, 72, 58, 90, 63, 78].map((height, index) => (
              <div className="customer-points-loading-chart__bar" key={index}>
                <Skeleton
                  className="customer-points-loading-chart__bar-fill"
                  shape="block"
                  style={{ height: `${height}%` }}
                />
                <Skeleton className="customer-points-loading-chart__label" shape="text" />
              </div>
            ))}
          </div>
        </section>
      </Surface>

      <RecentTransactions title="최근 커밋" transactions={[]} />
    </>
  );
}

function DailyCommitContent({
  activity,
  chartData,
  transactions,
}: {
  activity: Activity[];
  chartData: readonly CommitChartDatum[];
  transactions: readonly RecentTransaction[];
}) {
  return (
    <>
      <Surface asChild className="customer-points-calendar-card" padding="none">
        <section aria-label="최근 커밋 활동">
          <div className="customer-points-calendar">
            {activity.length > 0 ? (
              <ActivityCalendar
                blockMargin={5}
                blockRadius={4}
                blockSize={14}
                colorScheme="light"
                data={activity}
                fontSize={11}
                labels={{
                  legend: { less: "적음", more: "많음" },
                  months: [
                    "1월",
                    "2월",
                    "3월",
                    "4월",
                    "5월",
                    "6월",
                    "7월",
                    "8월",
                    "9월",
                    "10월",
                    "11월",
                    "12월",
                  ],
                  totalCount: "{{count}} 커밋",
                  weekdays: ["일", "월", "화", "수", "목", "금", "토"],
                }}
                showColorLegend={false}
                showMonthLabels={false}
                showTotalCount={false}
                showWeekdayLabels={false}
                theme={{
                  light: ["#edf2f7", "#c9efd4", "#86d99a", "#3fb866", "#187a3a"],
                }}
                weekStart={0}
              />
            ) : (
              <div className="customer-points-empty-state">
                <span>커밋 기록이 없습니다</span>
              </div>
            )}
          </div>
        </section>
      </Surface>

      <Surface asChild className="customer-points-month-tabs-card" padding="none">
        <section aria-label="커밋 차트 범위 선택">
          <div className="customer-points-month-tabs" role="tablist" aria-label="커밋 차트 범위">
            <button aria-selected="true" role="tab" type="button">
              월별
            </button>
            <button aria-selected="false" role="tab" type="button">
              주별
            </button>
            <button aria-selected="false" role="tab" type="button">
              일별
            </button>
          </div>
        </section>
      </Surface>

      <Surface asChild className="customer-points-month-card" padding="none">
        <section aria-label="월별 커밋 예측">
          <div className="customer-points-month-chart">
            {chartData.length > 0 ? (
              <BarChart
                data={chartData}
                margin={{ bottom: 12, left: 8, right: 8, top: 28 }}
                responsive
                style={{ height: "100%", width: "100%" }}
              >
                <XAxis
                  axisLine={false}
                  dataKey="label"
                  interval={0}
                  tick={{ fill: "#4b5563", fontSize: 12, fontWeight: 700 }}
                  tickLine={false}
                />
                <Bar dataKey="commits" radius={[6, 6, 6, 6]}>
                  {chartData.map((item) => (
                    <Cell
                      fill={item.current ? "#22a852" : "#e5e7eb"}
                      key={item.period ?? item.label}
                    />
                  ))}
                  <LabelList content={<CommitBarLabel data={chartData} />} dataKey="commits" />
                </Bar>
              </BarChart>
            ) : (
              <div className="customer-points-empty-state">커밋 통계가 없습니다</div>
            )}
          </div>
        </section>
      </Surface>

      <RecentTransactions title="최근 커밋" transactions={transactions} />
    </>
  );
}

function WorldcupPointLoadingContent() {
  return (
    <>
      <div
        className="customer-points-worldcup-days customer-points-worldcup-days--loading"
        aria-busy="true"
        aria-label="경기 날짜 불러오는 중"
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            className="customer-points-worldcup-days__loading-item"
            key={index}
            shape="block"
          />
        ))}
      </div>

      <section
        className="customer-points-worldcup-schedule"
        aria-busy="true"
        aria-label="월드컵 경기 일정 불러오는 중"
      >
        <Surface asChild className="customer-points-worldcup-card" padding="none">
          <div className="customer-points-worldcup-loading-list">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="customer-points-worldcup-loading-match" key={index}>
                <Skeleton className="customer-points-worldcup-loading-match__team" shape="text" />
                <Skeleton className="customer-points-worldcup-loading-match__score" shape="block" />
                <Skeleton className="customer-points-worldcup-loading-match__status" shape="text" />
                <Skeleton className="customer-points-worldcup-loading-match__score" shape="block" />
                <Skeleton className="customer-points-worldcup-loading-match__team" shape="text" />
              </div>
            ))}
          </div>
        </Surface>
      </section>
    </>
  );
}

function WorldcupPointContent({ matchDays }: { matchDays: readonly WorldcupMatchDay[] }) {
  const dayTabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [selectedDayKey, setSelectedDayKey] = useState(() => {
    const activeDay = matchDays.find((day) => day.isActive) ?? matchDays[0];

    return activeDay ? getWorldcupDayKey(activeDay) : "";
  });
  const selectedDay =
    matchDays.find((day) => getWorldcupDayKey(day) === selectedDayKey) ??
    matchDays.find((day) => day.isActive) ??
    matchDays[0];

  useEffect(() => {
    if (!selectedDayKey) {
      return;
    }

    window.requestAnimationFrame(() => {
      dayTabRefs.current.get(selectedDayKey)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  }, [selectedDayKey]);

  if (matchDays.length === 0) {
    return (
      <Surface asChild className="customer-points-worldcup-empty-card" padding="none">
        <section aria-label="월드컵 포인트">
          <div className="customer-points-worldcup-empty">경기 일정이 없습니다</div>
        </section>
      </Surface>
    );
  }

  return (
    <>
      <div className="customer-points-worldcup-days" role="tablist" aria-label="경기 날짜">
        {matchDays.map((day) => {
          const dayKey = getWorldcupDayKey(day);

          return (
            <button
              aria-selected={
                selectedDay && getWorldcupDayKey(selectedDay) === dayKey ? "true" : "false"
              }
              key={dayKey}
              onClick={() => {
                setSelectedDayKey(dayKey);
              }}
              ref={(element) => {
                if (element) {
                  dayTabRefs.current.set(dayKey, element);
                } else {
                  dayTabRefs.current.delete(dayKey);
                }
              }}
              role="tab"
              type="button"
            >
              {day.badge ? (
                <span className="customer-points-worldcup-days__badge">{day.badge}</span>
              ) : null}
              <strong>
                {day.date.padStart(5, "0")}. ({day.label})
              </strong>
            </button>
          );
        })}
      </div>

      <section className="customer-points-worldcup-schedule" aria-label="월드컵 포인트">
        {selectedDay ? (
          <div className="customer-points-worldcup-day" key={getWorldcupDayKey(selectedDay)}>
            {selectedDay.matches.length > 0 ? (
              groupWorldcupMatchesByTime(selectedDay.matches).map((group) => (
                <div
                  className="customer-points-worldcup-time-group"
                  key={`${getWorldcupDayKey(selectedDay)}-${group.timeLabel ?? "without-time"}`}
                >
                  {group.timeLabel ? (
                    <time className="customer-points-worldcup-time" dateTime={group.timeLabel}>
                      <strong>{group.timeLabel}</strong>
                      {group.matches.length > 1 ? <span>{group.matches.length}경기</span> : null}
                    </time>
                  ) : null}
                  <Surface asChild className="customer-points-worldcup-card" padding="none">
                    <div className="customer-points-worldcup-match-list">
                      {group.matches.map((match) => (
                        <a
                          className="customer-points-worldcup-match"
                          href={`/points/worldcup/${getWorldcupMatchId(selectedDay, match)}`}
                          key={
                            match.id ?? `${selectedDay.date}-${match.home.name}-${match.away.name}`
                          }
                          onClick={(event) => {
                            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                              return;
                            }

                            event.preventDefault();
                            pushCustomerPath(
                              `/points/worldcup/${getWorldcupMatchId(selectedDay, match)}`,
                            );
                          }}
                        >
                          <div className="customer-points-worldcup-team customer-points-worldcup-team--home">
                            <span className="customer-points-worldcup-team__name">
                              {match.home.name}
                            </span>
                            <WorldcupFlag team={match.home} />
                          </div>
                          <strong className="customer-points-worldcup-score">
                            {match.home.score ?? "-"}
                          </strong>
                          <div
                            className="customer-points-worldcup-status"
                            data-status={match.status}
                          >
                            <span>{match.status}</span>
                            <small>{match.subtitle}</small>
                          </div>
                          <strong className="customer-points-worldcup-score">
                            {match.away.score ?? "-"}
                          </strong>
                          <div className="customer-points-worldcup-team">
                            <WorldcupFlag team={match.away} />
                            <span className="customer-points-worldcup-team__name">
                              {match.away.name}
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </Surface>
                </div>
              ))
            ) : (
              <Surface asChild className="customer-points-worldcup-card" padding="none">
                <div className="customer-points-worldcup-empty">경기가 없습니다</div>
              </Surface>
            )}
          </div>
        ) : null}
      </section>
    </>
  );
}

function WorldcupMatchDetailContent({ detail }: { detail: WorldcupMatchDetail }) {
  const { day, match, matchId } = detail;
  const isApiMode = isCustomerApiEnabled();
  const matchTime = match.time ?? "경기 종료";
  const [apiMetrics, setApiMetrics] = useState<WorldcupMatchMetric[] | undefined>(() =>
    isApiMode ? [] : undefined,
  );
  const [apiLineups, setApiLineups] = useState<
    | {
        away: WorldcupTeamLineup;
        home: WorldcupTeamLineup;
      }
    | undefined
  >(() =>
    isApiMode
      ? {
          away: getEmptyWorldcupLineup(),
          home: getEmptyWorldcupLineup(),
        }
      : undefined,
  );
  const [predictionStats, setPredictionStats] = useState(() => getWorldcupPredictionStats(matchId));
  const [selectedPrediction, setSelectedPrediction] =
    useState<CustomerWorldcupPredictionPick | null>(null);
  const [draftPrediction, setDraftPrediction] = useState<CustomerWorldcupPredictionPick | null>(
    null,
  );
  const [canPredict, setCanPredict] = useState(match.status === "예정");
  const [canCancelPrediction, setCanCancelPrediction] = useState(false);
  const [selectedStakeAmount, setSelectedStakeAmount] = useState<number | null>(null);
  const [totalPredictionStakeAmount, setTotalPredictionStakeAmount] = useState(() =>
    getWorldcupPredictionStakeAmount(matchId),
  );
  const [predictionStakeAmount, setPredictionStakeAmount] = useState("100");
  const [isPredictionSubmitting, setIsPredictionSubmitting] = useState(false);
  const homeLineup = apiLineups?.home ?? getWorldcupLineup(match.home);
  const awayLineup = apiLineups?.away ?? getWorldcupLineup(match.away);
  const matchMetrics = apiMetrics ?? worldcupMatchMetrics;

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void fetchCustomerWorldcupPredictionSummary(matchId)
      .then((summary) => {
        if (!isCancelled) {
          setPredictionStats({
            away: summary.awayPercent,
            draw: summary.drawPercent,
            home: summary.homePercent,
          });
          setSelectedPrediction(summary.myPrediction);
          setCanPredict(summary.canPredict);
          setCanCancelPrediction(Boolean(summary.canCancel));
          setSelectedStakeAmount(summary.myStakeAmount ?? null);
          setTotalPredictionStakeAmount(summary.totalStakeAmount ?? 0);
          setDraftPrediction(null);
        }
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;

    void fetchCustomerWorldcupStats(matchId)
      .then((metrics) => {
        if (!isCancelled) {
          setApiMetrics(metrics.map(mapWorldcupMetricDto));
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setApiMetrics([]);
        }
      });

    void fetchCustomerWorldcupLineups(matchId)
      .then((lineups) => {
        if (isCancelled) {
          return;
        }

        const homeDto = lineups.find((lineup) => lineup.teamId === match.home.id) ?? lineups[0];
        const awayDto = lineups.find((lineup) => lineup.teamId === match.away.id) ?? lineups[1];
        const homeApiLineup = mapWorldcupLineupDto(homeDto) ?? getEmptyWorldcupLineup();
        const awayApiLineup = mapWorldcupLineupDto(awayDto) ?? getEmptyWorldcupLineup();

        setApiLineups({
          away: awayApiLineup,
          home: homeApiLineup,
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setApiLineups({
            away: getEmptyWorldcupLineup(),
            home: getEmptyWorldcupLineup(),
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [match.away.id, match.home.id, matchId]);

  const handlePredictionSubmit = async (
    pick: CustomerWorldcupPredictionPick,
    stakeAmount: number,
  ) => {
    if (!canPredict) {
      return;
    }
    if (!isCustomerApiEnabled()) {
      setSelectedPrediction(pick);
      setDraftPrediction(null);
      return;
    }

    setIsPredictionSubmitting(true);

    try {
      await createCustomerWorldcupPrediction(matchId, pick, stakeAmount);
      const summary = await fetchCustomerWorldcupPredictionSummary(matchId);
      setPredictionStats({
        away: summary.awayPercent,
        draw: summary.drawPercent,
        home: summary.homePercent,
      });
      setSelectedPrediction(summary.myPrediction ?? pick);
      setCanPredict(summary.canPredict);
      setCanCancelPrediction(Boolean(summary.canCancel));
      setSelectedStakeAmount(summary.myStakeAmount ?? stakeAmount);
      setTotalPredictionStakeAmount(summary.totalStakeAmount ?? stakeAmount);
      setDraftPrediction(null);
    } catch {
      // 서버 예측 저장 실패는 현재 화면 상태를 유지한다.
    } finally {
      setIsPredictionSubmitting(false);
    }
  };

  const handlePredictionCancel = async () => {
    if (!selectedPrediction || !canCancelPrediction) {
      return;
    }
    if (!isCustomerApiEnabled()) {
      setSelectedPrediction(null);
      setSelectedStakeAmount(null);
      setCanPredict(match.status === "예정");
      setCanCancelPrediction(false);
      return;
    }

    setIsPredictionSubmitting(true);

    try {
      await cancelCustomerWorldcupPrediction(matchId);
      const summary = await fetchCustomerWorldcupPredictionSummary(matchId);
      setPredictionStats({
        away: summary.awayPercent,
        draw: summary.drawPercent,
        home: summary.homePercent,
      });
      setSelectedPrediction(summary.myPrediction);
      setCanPredict(summary.canPredict);
      setCanCancelPrediction(Boolean(summary.canCancel));
      setSelectedStakeAmount(summary.myStakeAmount ?? null);
      setTotalPredictionStakeAmount(summary.totalStakeAmount ?? 0);
      setDraftPrediction(null);
    } catch {
      // 서버 취소 실패는 현재 화면 상태를 유지한다.
    } finally {
      setIsPredictionSubmitting(false);
    }
  };

  return (
    <div className="customer-points-worldcup-detail">
      <Surface asChild className="customer-points-worldcup-detail-card" padding="none">
        <section aria-labelledby="customer-worldcup-detail-title">
          <h1 id="customer-worldcup-detail-title">
            {match.home.name} vs {match.away.name}
          </h1>

          <div className="customer-points-worldcup-detail-match">
            <div className="customer-points-worldcup-team customer-points-worldcup-team--home">
              <span className="customer-points-worldcup-team__name">{match.home.name}</span>
              <WorldcupFlag team={match.home} />
            </div>
            <strong className="customer-points-worldcup-score">{match.home.score ?? "-"}</strong>
            <div className="customer-points-worldcup-status" data-status={match.status}>
              <span>{match.status}</span>
              <small>{match.subtitle}</small>
            </div>
            <strong className="customer-points-worldcup-score">{match.away.score ?? "-"}</strong>
            <div className="customer-points-worldcup-team">
              <WorldcupFlag team={match.away} />
              <span className="customer-points-worldcup-team__name">{match.away.name}</span>
            </div>
          </div>

          <dl className="customer-points-worldcup-detail__info">
            <div>
              <dt>날짜</dt>
              <dd>
                {day.date}. ({day.label})
              </dd>
            </div>
            <div>
              <dt>경기 시간</dt>
              <dd>{matchTime}</dd>
            </div>
            <div>
              <dt>구분</dt>
              <dd>{match.subtitle}</dd>
            </div>
          </dl>
        </section>
      </Surface>

      <WorldcupPredictionPayoutCard amount={totalPredictionStakeAmount} />

      <WorldcupPredictionStatsCard match={match} stats={predictionStats} />

      <WorldcupMatchStatsCard match={match} metrics={matchMetrics} />

      <WorldcupLineupCard
        awayLineup={awayLineup}
        awayTeam={match.away}
        homeLineup={homeLineup}
        homeTeam={match.home}
      />

      <WorldcupPlayerTable
        awayLineup={awayLineup}
        awayTeam={match.away}
        homeLineup={homeLineup}
        homeTeam={match.home}
      />

      <WorldcupFloatingPrediction
        canCancel={canCancelPrediction}
        draftPick={draftPrediction}
        disabled={isPredictionSubmitting || (!canPredict && selectedPrediction === null)}
        match={match}
        onCancel={handlePredictionCancel}
        onDraftPick={setDraftPrediction}
        onStakeAmountChange={setPredictionStakeAmount}
        onSubmit={handlePredictionSubmit}
        selectedPick={selectedPrediction}
        selectedStakeAmount={selectedStakeAmount}
        stakeAmount={predictionStakeAmount}
      />
    </div>
  );
}

function WorldcupPredictionPayoutCard({ amount }: { amount: number }) {
  return (
    <Surface asChild className="customer-points-worldcup-payout-card" padding="none">
      <section aria-labelledby="customer-worldcup-payout-title">
        <div>
          <h2 id="customer-worldcup-payout-title">총 배당금</h2>
          <span>승부예측 누적 풀</span>
        </div>
        <strong>{amount.toLocaleString("ko-KR")}P</strong>
      </section>
    </Surface>
  );
}

function WorldcupPredictionStatsCard({
  match,
  stats,
}: {
  match: WorldcupMatch;
  stats: WorldcupPredictionStats;
}) {
  return (
    <Surface asChild className="customer-points-worldcup-prediction-card" padding="none">
      <section aria-labelledby="customer-worldcup-prediction-title">
        <h2 id="customer-worldcup-prediction-title">승부예측 통계</h2>
        <div className="customer-points-worldcup-prediction-stats">
          <div>
            <WorldcupFlag team={match.home} />
            <strong>{match.home.name}</strong>
            <span>{stats.home}%</span>
          </div>
          <div className="customer-points-worldcup-prediction-stats__draw">
            <strong>
              {match.home.score ?? "-"} : {match.away.score ?? "-"}
            </strong>
            <span>무승부 {stats.draw}%</span>
          </div>
          <div>
            <WorldcupFlag team={match.away} />
            <strong>{match.away.name}</strong>
            <span>{stats.away}%</span>
          </div>
        </div>
      </section>
    </Surface>
  );
}

function WorldcupMatchStatsCard({
  match,
  metrics,
}: {
  match: WorldcupMatch;
  metrics: readonly WorldcupMatchMetric[];
}) {
  return (
    <Surface asChild className="customer-points-worldcup-stats-card" padding="none">
      <section aria-labelledby="customer-worldcup-stats-title">
        <header className="customer-points-worldcup-section-header">
          <h2 id="customer-worldcup-stats-title">경기 지표</h2>
          <span>
            {match.home.name} vs {match.away.name}
          </span>
        </header>
        {metrics.length > 0 ? (
          <div className="customer-points-worldcup-stat-list">
            {metrics.map((metric) => {
              const max = Math.max(metric.home, metric.away, 1);

              return (
                <div className="customer-points-worldcup-stat-row" key={metric.label}>
                  <div className="customer-points-worldcup-stat-side customer-points-worldcup-stat-side--home">
                    <span
                      className="customer-points-worldcup-stat-bar"
                      style={{ width: `${Math.max(4, (metric.home / max) * 100)}%` }}
                    />
                    <strong>{metric.homeDisplay ?? metric.home}</strong>
                  </div>
                  <span className="customer-points-worldcup-stat-label">{metric.label}</span>
                  <div className="customer-points-worldcup-stat-side">
                    <strong>{metric.awayDisplay ?? metric.away}</strong>
                    <span
                      className="customer-points-worldcup-stat-bar"
                      style={{ width: `${Math.max(4, (metric.away / max) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="customer-points-worldcup-empty">경기 지표가 없습니다</div>
        )}
      </section>
    </Surface>
  );
}

function WorldcupLineupCard({
  awayLineup,
  awayTeam,
  homeLineup,
  homeTeam,
}: {
  awayLineup: WorldcupTeamLineup;
  awayTeam: WorldcupTeam;
  homeLineup: WorldcupTeamLineup;
  homeTeam: WorldcupTeam;
}) {
  const homeSoccerTeam = buildSoccerLineupTeam(homeLineup, "home");
  const awaySoccerTeam = buildSoccerLineupTeam(awayLineup, "away");

  return (
    <Surface asChild className="customer-points-worldcup-lineup-card" padding="none">
      <section aria-labelledby="customer-worldcup-lineup-title">
        <header className="customer-points-worldcup-lineup-header">
          <h2 id="customer-worldcup-lineup-title">라인업</h2>
        </header>

        <div className="customer-points-worldcup-lineup-meta">
          <div>
            <WorldcupFlag team={homeTeam} />
            <strong>{homeTeam.name}</strong>
            <span>{homeLineup.formation}</span>
          </div>
          <span>vs</span>
          <div>
            <WorldcupFlag team={awayTeam} />
            <strong>{awayTeam.name}</strong>
            <span>{awayLineup.formation}</span>
          </div>
        </div>

        {homeLineup.players.length > 0 && awayLineup.players.length > 0 ? (
          <div className="customer-points-worldcup-soccer-lineup" aria-label="선발 라인업">
            <SoccerLineUp
              awayTeam={awaySoccerTeam}
              color="#07945c"
              homeTeam={homeSoccerTeam}
              orientation="vertical"
              pattern="lines"
              size="responsive"
            />
          </div>
        ) : (
          <div className="customer-points-worldcup-empty">라인업이 없습니다</div>
        )}

        <footer className="customer-points-worldcup-lineup-footer">
          <span>감독 {homeLineup.coach}</span>
          <span>감독 {awayLineup.coach}</span>
        </footer>
      </section>
    </Surface>
  );
}

function WorldcupPlayerTable({
  awayLineup,
  awayTeam,
  homeLineup,
  homeTeam,
}: {
  awayLineup: WorldcupTeamLineup;
  awayTeam: WorldcupTeam;
  homeLineup: WorldcupTeamLineup;
  homeTeam: WorldcupTeam;
}) {
  const players = [
    ...homeLineup.players.map((player) => ({ player, team: homeTeam })),
    ...awayLineup.players.map((player) => ({ player, team: awayTeam })),
  ];

  return (
    <Surface asChild className="customer-points-worldcup-player-card" padding="none">
      <section aria-labelledby="customer-worldcup-player-title">
        <header className="customer-points-worldcup-section-header">
          <h2 id="customer-worldcup-player-title">선수 리스트</h2>
          <span>{players.length}명</span>
        </header>
        {players.length > 0 ? (
          <div className="customer-points-worldcup-player-table-wrap">
            <table className="customer-points-worldcup-player-table">
              <thead>
                <tr>
                  <th>팀</th>
                  <th>번호</th>
                  <th>선수</th>
                  <th>포지션</th>
                </tr>
              </thead>
              <tbody>
                {players.map(({ player, team }) => (
                  <tr key={`${team.countryCode}-${player.number}-${player.name}`}>
                    <td>{team.name}</td>
                    <td>{player.number}</td>
                    <td>{player.name}</td>
                    <td>{player.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-points-worldcup-empty">선수 정보가 없습니다</div>
        )}
      </section>
    </Surface>
  );
}

function WorldcupFloatingPrediction({
  canCancel,
  draftPick,
  disabled,
  match,
  onCancel,
  onDraftPick,
  onStakeAmountChange,
  onSubmit,
  selectedPick,
  selectedStakeAmount,
  stakeAmount,
}: {
  canCancel: boolean;
  draftPick: CustomerWorldcupPredictionPick | null;
  disabled: boolean;
  match: WorldcupMatch;
  onCancel: () => Promise<void>;
  onDraftPick: (pick: CustomerWorldcupPredictionPick) => void;
  onStakeAmountChange: (value: string) => void;
  onSubmit: (pick: CustomerWorldcupPredictionPick, stakeAmount: number) => Promise<void>;
  selectedPick: CustomerWorldcupPredictionPick | null;
  selectedStakeAmount: number | null;
  stakeAmount: string;
}) {
  const activePick = selectedPick ?? draftPick;
  const isExpanded = draftPick !== null && selectedPick === null;
  const isSelected = selectedPick !== null;
  const parsedStakeAmount = Math.max(0, Number.parseInt(stakeAmount, 10) || 0);
  const activeLabel =
    activePick === "home" ? match.home.name : activePick === "away" ? match.away.name : "무승부";

  return (
    <div
      className="customer-points-worldcup-floating-prediction"
      aria-label="승부예측 선택"
      data-expanded={isExpanded ? "true" : "false"}
      data-has-cancel={canCancel && isSelected ? "true" : "false"}
      data-selected={activePick ?? "none"}
    >
      <button
        aria-pressed={activePick === "home"}
        data-pick="home"
        disabled={disabled || selectedPick !== null}
        onClick={() => {
          onDraftPick("home");
        }}
        type="button"
      >
        {match.home.name}
      </button>
      <button
        aria-pressed={activePick === "draw"}
        data-pick="draw"
        disabled={disabled || selectedPick !== null}
        onClick={() => {
          onDraftPick("draw");
        }}
        type="button"
      >
        무승부
      </button>
      <button
        aria-pressed={activePick === "away"}
        data-pick="away"
        disabled={disabled || selectedPick !== null}
        onClick={() => {
          onDraftPick("away");
        }}
        type="button"
      >
        {match.away.name}
      </button>
      <form
        className="customer-points-worldcup-floating-prediction__stake"
        onSubmit={(event) => {
          event.preventDefault();

          if (draftPick && parsedStakeAmount > 0) {
            void onSubmit(draftPick, parsedStakeAmount);
          }
        }}
      >
        <label>
          <span>{activeLabel} 투표 금액</span>
          <div className="customer-points-worldcup-floating-prediction__input-wrap">
            <input
              inputMode="numeric"
              min={1}
              onChange={(event) => {
                onStakeAmountChange(event.currentTarget.value.replace(/\D/g, ""));
              }}
              pattern="[0-9]*"
              type="text"
              value={stakeAmount}
            />
            <small>P</small>
          </div>
        </label>
        <button disabled={disabled || parsedStakeAmount <= 0} type="submit">
          투표하기
        </button>
      </form>
      {isSelected ? (
        <div className="customer-points-worldcup-floating-prediction__result">
          <span>
            {activeLabel}
            {selectedStakeAmount ? ` · ${selectedStakeAmount.toLocaleString("ko-KR")}P` : null}
          </span>
          {canCancel ? (
            <button
              disabled={disabled}
              onClick={() => {
                void onCancel();
              }}
              type="button"
            >
              취소
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WorldcupFlag({ team }: { team: WorldcupTeam }) {
  const FlagIcon = worldcupFlagIcons[team.countryCode as WorldcupStaticFlagCode];

  if (FlagIcon) {
    return (
      <span className="customer-points-worldcup-team__flag">
        <FlagIcon aria-label={`${team.name} 국기`} role="img" />
      </span>
    );
  }

  if (team.logo) {
    return (
      <span className="customer-points-worldcup-team__flag">
        <img alt={`${team.name} 로고`} src={team.logo} />
      </span>
    );
  }

  return (
    <span className="customer-points-worldcup-team__flag">
      {team.countryCode.slice(0, 2).toUpperCase()}
    </span>
  );
}
