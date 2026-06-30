import { useEffect, useRef, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity } from "react-activity-calendar";
import { AR, AT, DZ, FR, IQ, JO, KR, MX, NO, SN } from "country-flag-icons/react/3x2";
import { Skeleton } from "@daema/ui/skeleton";
import { Surface } from "@daema/ui/surface";
import SoccerLineUp from "react-soccer-lineup";
import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts";

import type { RecentTransaction } from "../../entities/customer-home";
import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  fetchCustomerCommitActivity,
  fetchCustomerCommitStats,
  fetchCustomerCommitTransactions,
} from "../../shared/api/commits";
import {
  cancelCustomerWorldcupPrediction,
  createCustomerWorldcupPrediction,
  fetchCustomerWorldcupLineups,
  fetchCustomerWorldcupMatchDays,
  fetchCustomerWorldcupPredictionSummary,
  fetchCustomerWorldcupStats,
} from "../../shared/api/worldcup";
import type { CustomerWorldcupPredictionPick } from "../../shared/api/worldcup";
import { navigateCustomerPathFromClick } from "../../shared/lib/customerNavigation";
import { useCustomerPathname } from "../../shared/lib/useCustomerPathname";
import { AppHeader } from "../../widgets/app-header";
import { RecentTransactions } from "../../widgets/recent-transactions";
import {
  ACTIVITY_DAY_COUNT,
  commitActivity,
  commitHistoryTransactions,
  mapCommitActivityDto,
  mapCommitStatsDtos,
  mapCommitTransactionDto,
  monthlyCommitData,
} from "./model/commitPoints";
import type { CommitChartDatum } from "./model/commitPoints";
import {
  allowsWorldcupDrawPrediction,
  buildSoccerLineupTeam,
  getEmptyWorldcupLineup,
  getWorldcupDayKey,
  getWorldcupLineup,
  getWorldcupMatchDetail,
  getWorldcupMatchId,
  getWorldcupPredictionStakeAmount,
  getWorldcupPredictionStats,
  groupWorldcupMatchesByTime,
  mapWorldcupLineupDto,
  mapWorldcupMatchDayDto,
  mapWorldcupMetricDto,
  normalizeWorldcupMatchDays,
  worldcupMatchDays,
  worldcupMatchMetrics,
} from "./model/worldcupPoints";
import type {
  WorldcupMatch,
  WorldcupMatchDay,
  WorldcupMatchDetail,
  WorldcupMatchMetric,
  WorldcupPredictionStats,
  WorldcupStaticFlagCode,
  WorldcupTeam,
  WorldcupTeamLineup,
} from "./model/worldcupPoints";

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
  const pathname = useCustomerPathname();
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

      <main
        className={`customer-points-page${selectedWorldcupMatch ? " customer-points-page--worldcup-detail" : ""}`}
        aria-label="커밋 잔디"
      >
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
                            navigateCustomerPathFromClick(
                              event,
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

export function WorldcupMatchDetailContent({ detail }: { detail: WorldcupMatchDetail }) {
  const { day, match, matchId } = detail;
  const isApiMode = isCustomerApiEnabled();
  const allowsDrawPrediction = allowsWorldcupDrawPrediction(match);
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
  const effectiveDraftPrediction =
    draftPrediction === "draw" && !allowsDrawPrediction ? null : draftPrediction;
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
  const [activeDetailTab, setActiveDetailTab] = useState<"lineup" | "players" | "stats">("stats");

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
    if (!canPredict || (pick === "draw" && !allowsDrawPrediction)) {
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
      <section className="customer-points-worldcup-match-experience" aria-label="경기 및 승부예측">
        <Surface asChild className="customer-points-worldcup-detail-card" padding="none">
          <section aria-labelledby="customer-worldcup-detail-title" data-status={match.status}>
            <header className="customer-points-worldcup-detail-card__header">
              <div>
                <span>
                  {day.date} ({day.label}) · {match.subtitle}
                </span>
                <h1 id="customer-worldcup-detail-title">
                  {match.home.name} vs {match.away.name}
                </h1>
              </div>
              <strong>{match.status}</strong>
            </header>

            <div className="customer-points-worldcup-detail-match">
              <div className="customer-points-worldcup-detail-team">
                <WorldcupFlag team={match.home} />
                <strong>{match.home.name}</strong>
              </div>
              <div className="customer-points-worldcup-detail-score">
                <strong>
                  {match.home.score !== undefined && match.away.score !== undefined
                    ? `${match.home.score} : ${match.away.score}`
                    : (match.time ?? "VS")}
                </strong>
                <span>{match.status === "종료" ? "경기 종료" : "킥오프 · KST"}</span>
              </div>
              <div className="customer-points-worldcup-detail-team">
                <WorldcupFlag team={match.away} />
                <strong>{match.away.name}</strong>
              </div>
            </div>

            <dl className="customer-points-worldcup-detail__info">
              <div>
                <dt>경기 시간</dt>
                <dd>{matchTime}</dd>
              </div>
              <div>
                <dt>예측 마감</dt>
                <dd>킥오프 전</dd>
              </div>
            </dl>
          </section>
        </Surface>

        <WorldcupFloatingPrediction
          allowsDrawPrediction={allowsDrawPrediction}
          canCancel={canCancelPrediction}
          draftPick={effectiveDraftPrediction}
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

        <div className="customer-points-worldcup-prediction-insights">
          <WorldcupPredictionPayoutCard amount={totalPredictionStakeAmount} />
          <WorldcupPredictionStatsCard match={match} stats={predictionStats} />
        </div>
      </section>

      <section className="customer-points-worldcup-data-card" aria-label="경기 상세 정보">
        <div className="customer-points-worldcup-detail-tabs" role="tablist" aria-label="경기 정보">
          <button
            aria-selected={activeDetailTab === "stats"}
            onClick={() => {
              setActiveDetailTab("stats");
            }}
            role="tab"
            type="button"
          >
            경기 지표
          </button>
          <button
            aria-selected={activeDetailTab === "lineup"}
            onClick={() => {
              setActiveDetailTab("lineup");
            }}
            role="tab"
            type="button"
          >
            라인업
          </button>
          <button
            aria-selected={activeDetailTab === "players"}
            onClick={() => {
              setActiveDetailTab("players");
            }}
            role="tab"
            type="button"
          >
            선수
          </button>
        </div>

        {activeDetailTab === "stats" ? (
          <WorldcupMatchStatsCard match={match} metrics={matchMetrics} />
        ) : null}
        {activeDetailTab === "lineup" ? (
          <WorldcupLineupCard
            awayLineup={awayLineup}
            awayTeam={match.away}
            homeLineup={homeLineup}
            homeTeam={match.home}
          />
        ) : null}
        {activeDetailTab === "players" ? (
          <WorldcupPlayerTable
            awayLineup={awayLineup}
            awayTeam={match.away}
            homeLineup={homeLineup}
            homeTeam={match.home}
          />
        ) : null}
      </section>
    </div>
  );
}

function WorldcupPredictionPayoutCard({ amount }: { amount: number }) {
  return (
    <Surface asChild className="customer-points-worldcup-payout-card" padding="none">
      <section aria-labelledby="customer-worldcup-payout-title">
        <div>
          <h2 id="customer-worldcup-payout-title">현재 모인 포인트</h2>
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
        <header className="customer-points-worldcup-prediction-card__header">
          <div>
            <h2 id="customer-worldcup-prediction-title">다른 사람들은 이렇게 예측했어요</h2>
          </div>
          <small>실시간</small>
        </header>
        <div className="customer-points-worldcup-prediction-bar" aria-hidden="true">
          <span style={{ width: `${stats.home}%` }} />
          <span style={{ width: `${stats.draw}%` }} />
          <span style={{ width: `${stats.away}%` }} />
        </div>
        <div className="customer-points-worldcup-prediction-stats">
          <div>
            <WorldcupFlag team={match.home} />
            <span>{match.home.name}</span>
            <strong>{stats.home}%</strong>
          </div>
          <div className="customer-points-worldcup-prediction-stats__draw">
            <span>무승부</span>
            <strong>{stats.draw}%</strong>
          </div>
          <div>
            <WorldcupFlag team={match.away} />
            <span>{match.away.name}</span>
            <strong>{stats.away}%</strong>
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
  allowsDrawPrediction,
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
  allowsDrawPrediction: boolean;
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
  const visibleActivePick = activePick === "draw" && !allowsDrawPrediction ? null : activePick;
  const isExpanded = draftPick !== null && selectedPick === null;
  const isSelected = selectedPick !== null;
  const parsedStakeAmount = Math.max(0, Number.parseInt(stakeAmount, 10) || 0);
  const activeLabel =
    activePick === "home" ? match.home.name : activePick === "away" ? match.away.name : "무승부";

  return (
    <div
      className="customer-points-worldcup-floating-prediction"
      aria-label="승부예측 선택"
      data-allows-draw={allowsDrawPrediction ? "true" : "false"}
      data-expanded={isExpanded ? "true" : "false"}
      data-has-cancel={canCancel && isSelected ? "true" : "false"}
      data-selected={visibleActivePick ?? "none"}
    >
      <div className="customer-points-worldcup-floating-prediction__header">
        <strong>{isSelected ? "예측이 완료됐어요" : "어느 팀이 이길까요?"}</strong>
        <span>
          {isSelected
            ? `${activeLabel}${selectedStakeAmount ? ` · ${selectedStakeAmount.toLocaleString("ko-KR")}P` : ""}`
            : "한 팀을 골라주세요. 킥오프 전까지 바꿀 수 있어요"}
        </span>
      </div>
      <div className="customer-points-worldcup-floating-prediction__choices">
        <button
          aria-pressed={activePick === "home"}
          data-pick="home"
          disabled={disabled || selectedPick !== null}
          onClick={() => {
            onDraftPick("home");
          }}
          type="button"
        >
          <WorldcupFlag team={match.home} />
          <span>
            <strong>{match.home.name}</strong>
            <small>승리</small>
          </span>
          <span className="customer-points-worldcup-floating-prediction__check" aria-hidden="true">
            ✓
          </span>
        </button>
        {allowsDrawPrediction ? (
          <button
            aria-pressed={activePick === "draw"}
            data-pick="draw"
            disabled={disabled || selectedPick !== null}
            onClick={() => {
              onDraftPick("draw");
            }}
            type="button"
          >
            <span
              className="customer-points-worldcup-floating-prediction__draw-mark"
              aria-hidden="true"
            >
              무
            </span>
            <span>
              <strong>무승부</strong>
              <small>두 팀이 비겨요</small>
            </span>
            <span
              className="customer-points-worldcup-floating-prediction__check"
              aria-hidden="true"
            >
              ✓
            </span>
          </button>
        ) : null}
        <button
          aria-pressed={activePick === "away"}
          data-pick="away"
          disabled={disabled || selectedPick !== null}
          onClick={() => {
            onDraftPick("away");
          }}
          type="button"
        >
          <WorldcupFlag team={match.away} />
          <span>
            <strong>{match.away.name}</strong>
            <small>승리</small>
          </span>
          <span className="customer-points-worldcup-floating-prediction__check" aria-hidden="true">
            ✓
          </span>
        </button>
      </div>
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
          <span className="customer-points-worldcup-floating-prediction__stake-label">
            <strong>예측할 포인트</strong>
            <small>최소 1P</small>
          </span>
          <div className="customer-points-worldcup-floating-prediction__input-wrap">
            <input
              aria-describedby="customer-worldcup-prediction-notice"
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
        <div className="customer-points-worldcup-floating-prediction__quick-amounts">
          {[100, 500, 1000].map((amount) => (
            <button
              aria-pressed={parsedStakeAmount === amount}
              key={amount}
              onClick={() => {
                onStakeAmountChange(String(amount));
              }}
              type="button"
            >
              {amount.toLocaleString("ko-KR")}P
            </button>
          ))}
        </div>
        <p
          className="customer-points-worldcup-floating-prediction__notice"
          id="customer-worldcup-prediction-notice"
        >
          <span aria-hidden="true">i</span>
          경기가 취소되면 사용한 포인트는 자동으로 돌아와요
        </p>
        <button disabled={disabled || parsedStakeAmount <= 0} type="submit">
          {parsedStakeAmount.toLocaleString("ko-KR")}P 예측하기
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
