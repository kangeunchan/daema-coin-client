import type { Team as SoccerLineupTeam } from "react-soccer-lineup";

import type {
  CustomerWorldcupLineupDto,
  CustomerWorldcupLineupPlayerDto,
  CustomerWorldcupMatchDayDto,
  CustomerWorldcupMatchDto,
  CustomerWorldcupMatchMetricDto,
} from "../../../shared/api/worldcup";

export type WorldcupTeam = {
  countryCode: string;
  id?: string;
  logo?: string;
  name: string;
  score?: number;
};

export type WorldcupMatch = {
  away: WorldcupTeam;
  home: WorldcupTeam;
  id?: string;
  startsAt?: string;
  status: "예정" | "진행중" | "종료";
  subtitle: string;
  time?: string;
};

export type WorldcupMatchDay = {
  badge?: string;
  date: string;
  id?: string;
  isActive?: boolean;
  label: string;
  matches: readonly WorldcupMatch[];
};

export type WorldcupMatchTimeGroup = {
  matches: WorldcupMatch[];
  timeLabel?: string;
};

export type WorldcupMatchDetail = {
  day: WorldcupMatchDay;
  match: WorldcupMatch;
  matchId: string;
};

export type WorldcupPredictionStats = {
  away: number;
  draw: number;
  home: number;
};

export type WorldcupMatchMetric = {
  away: number;
  awayDisplay?: string;
  home: number;
  homeDisplay?: string;
  label: string;
};

export type WorldcupPlayer = {
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

export type WorldcupStaticFlagCode = "AR" | "AT" | "DZ" | "FR" | "IQ" | "JO" | "KR" | "MX" | "NO" | "SN";

type WorldcupTeamLineupSource = {
  coach: string;
  formation: string;
  players: readonly WorldcupPlayerSeed[];
};

export type WorldcupTeamLineup = {
  coach: string;
  formation: string;
  players: readonly WorldcupPlayer[];
};

type WorldcupSoccerLineRole = Exclude<keyof SoccerLineupTeam["squad"], "gk">;
type WorldcupSoccerPlayer = NonNullable<SoccerLineupTeam["squad"]["gk"]>;

export const worldcupMatchDays: readonly WorldcupMatchDay[] = [
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

export const worldcupMatchMetrics = [
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

export function normalizeWorldcupStatus(status: string, statusLabel?: string): WorldcupMatch["status"] {
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

export function mapWorldcupMatchDto(match: CustomerWorldcupMatchDto): WorldcupMatch {
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

export function mapWorldcupMatchDayDto(day: CustomerWorldcupMatchDayDto): WorldcupMatchDay {
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

export function mapWorldcupMetricDto(metric: CustomerWorldcupMatchMetricDto): WorldcupMatchMetric {
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

export function mapWorldcupLineupDto(lineup: CustomerWorldcupLineupDto | undefined) {
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

export function groupWorldcupMatchesByTime(matches: readonly WorldcupMatch[]): WorldcupMatchTimeGroup[] {
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

export function getWorldcupDayKey(day: WorldcupMatchDay) {
  return day.id ?? day.date;
}

function getTodayWorldcupDayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWorldcupDaySortValue(day: WorldcupMatchDay) {
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

export function normalizeWorldcupMatchDays(matchDays: readonly WorldcupMatchDay[]) {
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

export function getWorldcupMatchId(day: WorldcupMatchDay, match: WorldcupMatch) {
  if (match.id) {
    return match.id;
  }

  return `${day.date.replace(".", "")}-${match.home.countryCode}-${match.away.countryCode}`.toLowerCase();
}

export function getWorldcupMatchDetail(
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

export function getWorldcupLineup(team: WorldcupTeam): WorldcupTeamLineup {
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

export function getEmptyWorldcupLineup(): WorldcupTeamLineup {
  return {
    coach: "-",
    formation: "-",
    players: [],
  };
}

export function parseWorldcupFormation(formation: string) {
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

export function buildWorldcupPlayersFromFormation(
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

export function buildSoccerLineupTeam(
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

export function getWorldcupPredictionStats(matchId: string): WorldcupPredictionStats {
  return worldcupPredictionStats[matchId] ?? { away: 30, draw: 24, home: 46 };
}

export function getWorldcupPredictionStakeAmount(matchId: string) {
  return worldcupPredictionStakeAmounts[matchId] ?? 0;
}
