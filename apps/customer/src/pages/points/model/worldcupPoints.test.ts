import { afterEach, expect, test, vi } from "vitest";

import {
  buildWorldcupPlayersFromFormation,
  getWorldcupMatchDetail,
  getWorldcupMatchId,
  mapWorldcupMatchDayDto,
  normalizeWorldcupMatchDays,
  parseWorldcupFormation,
  worldcupMatchDays,
} from "./worldcupPoints";

afterEach(() => {
  vi.useRealTimers();
});

test("normalizes active worldcup day based on the current date", () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-26T00:00:00+09:00"));

  const normalized = normalizeWorldcupMatchDays(worldcupMatchDays);

  expect(normalized.map((day) => day.date)).toEqual(["6.23", "6.25", "6.26", "6.27"]);
  expect(normalized.find((day) => day.isActive)).toMatchObject({
    date: "6.26",
    label: "오늘",
  });
});

test("maps worldcup match-day dtos without leaking null scores", () => {
  const day = mapWorldcupMatchDayDto({
    date: "2026-06-26",
    id: "day-1",
    label: "금",
    matches: [
      {
        away: { countryCode: "MX", name: "멕시코", score: null },
        home: { countryCode: "KR", id: "kr", name: "대한민국", score: 1 },
        id: "match-1",
        status: "live",
        subtitle: "응원전",
      },
    ],
  });

  expect(day.matches[0]?.status).toBe("진행중");
  expect(day.matches[0]?.away.score).toBeUndefined();
  expect(day.matches[0]?.home.score).toBe(1);
});

test("resolves static match detail ids", () => {
  const day = worldcupMatchDays[2]!;
  const match = day.matches[0]!;

  expect(getWorldcupMatchId(day, match)).toBe("626-no-fr");
  expect(getWorldcupMatchDetail("/points/worldcup/626-no-fr")).toMatchObject({
    matchId: "626-no-fr",
  });
});

test("builds lineup positions from valid and invalid formations", () => {
  expect(parseWorldcupFormation("4-2-3-1")).toEqual([4, 2, 3, 1]);
  expect(parseWorldcupFormation("bad")).toEqual([4, 3, 3]);

  const players = buildWorldcupPlayersFromFormation(
    "4-2-3-1",
    Array.from({ length: 11 }, (_, index) => ({
      name: `선수 ${index + 1}`,
      number: index + 1,
    })),
  );

  expect(players).toHaveLength(11);
  expect(players[0]).toMatchObject({ position: "GK", x: 50, y: 88 });
  expect(players.at(-1)).toMatchObject({ position: "FW" });
});
