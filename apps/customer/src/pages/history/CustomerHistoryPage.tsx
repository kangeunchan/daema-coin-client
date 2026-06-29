import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Surface } from "@daema/ui/surface";

import { isCustomerApiEnabled } from "../../shared/api/client";
import {
  fetchCustomerLedgerAnalysis,
  fetchCustomerLedgerCalendar,
  fetchCustomerLedgerTransactions,
} from "../../shared/api/ledger";
import type {
  CustomerLedgerAnalysisDto,
  CustomerLedgerCalendarEntryDto,
  CustomerLedgerTransactionDto,
} from "../../shared/api/ledger";
import {
  formatLedgerRelativeTime,
  getLedgerRecordAmount,
  getRecordText,
  ledgerAmountValue,
} from "../../shared/api/customerDataMappers";
import { AppHeader } from "../../widgets/app-header";

type HistoryView = "calendar" | "transactions" | "analysis";

type HistoryCategory = {
  color: string;
  label: string;
  value: number;
};

type HistoryTransaction = {
  amount: number;
  label: string;
  time: string;
  type: "expense" | "income";
};

type HistoryCalendarEntry = {
  active?: boolean;
  day: number;
  expense?: number;
  income?: number;
};

type HistoryAnalysisData = {
  expenseCategories: readonly HistoryCategory[];
  expenseTotal: number;
  incomeCategories: readonly HistoryCategory[];
  incomeTotal: number;
};

const historyTabs = [
  { id: "calendar", label: "달력" },
  { id: "transactions", label: "거래 내역" },
  { id: "analysis", label: "수입/소비 분석" },
] satisfies readonly { id: HistoryView; label: string }[];

const expenseCategories = [
  { color: "#2563eb", label: "부스 결제", value: 8760 },
  { color: "#f97316", label: "먹거리", value: 4120 },
  { color: "#8b5cf6", label: "공연/이벤트", value: 3200 },
  { color: "#0f766e", label: "휴식 라운지", value: 2856 },
] satisfies readonly HistoryCategory[];

const incomeCategories = [
  { color: "#22c55e", label: "커밋 리워드", value: 11000 },
  { color: "#14b8a6", label: "승부예측 보상", value: 7200 },
  { color: "#60a5fa", label: "대마페이 페이백", value: 4870 },
  { color: "#facc15", label: "출석 리워드", value: 1800 },
] satisfies readonly HistoryCategory[];

const historyTransactions = [
  {
    amount: 1200,
    label: "[혜택] 출석체크 출석 리워드",
    time: "2시간 전",
    type: "income",
  },
  {
    amount: 800,
    label: "대마페이 보너스",
    time: "11시간 전",
    type: "income",
  },
  {
    amount: -4200,
    label: "굿딜 딘즈 쿠폰",
    time: "어제",
    type: "expense",
  },
  {
    amount: 1000,
    label: "매일모으기 리워드",
    time: "어제",
    type: "income",
  },
  {
    amount: 1000,
    label: "코드 작성 혜택",
    time: "2일 전",
    type: "income",
  },
  {
    amount: -2400,
    label: "포인트 교환",
    time: "3일 전",
    type: "expense",
  },
] satisfies readonly HistoryTransaction[];

const calendarEntries = [
  { day: 1, expense: 1200 },
  { day: 2, expense: 2000, income: 1800 },
  { day: 3, expense: 2800 },
  { day: 4 },
  { day: 5, expense: 499 },
  { day: 6, expense: 2110 },
  { day: 7 },
  { day: 8, expense: 3260 },
  { day: 9, income: 1000 },
  { day: 10, expense: 1700 },
  { day: 11, expense: 2400 },
  { day: 12, income: 1100 },
  { day: 13, expense: 600 },
  { day: 14, expense: 2200 },
  { day: 15, expense: 1420 },
  { day: 16, expense: 3000 },
  { day: 17, income: 3507 },
  { day: 18, income: 1200 },
  { day: 19, expense: 2842, income: 540 },
  { day: 20, expense: 6484 },
  { day: 21, expense: 356 },
  { day: 22, expense: 1400 },
  { day: 23, expense: 3200, income: 1200, active: true },
  { day: 24, income: 2460 },
  { day: 25, expense: 650 },
  { day: 26, expense: 4200 },
  { day: 27, expense: 3930, income: 2450 },
  { day: 28, income: 950 },
  { day: 29, expense: 2900 },
  { day: 30 },
] satisfies readonly HistoryCalendarEntry[];

const staticHistoryAnalysis = {
  expenseCategories,
  expenseTotal: expenseCategories.reduce((total, category) => total + category.value, 0),
  incomeCategories,
  incomeTotal: incomeCategories.reduce((total, category) => total + category.value, 0),
} satisfies HistoryAnalysisData;
const emptyHistoryAnalysis = {
  expenseCategories: [],
  expenseTotal: 0,
  incomeCategories: [],
  incomeTotal: 0,
} satisfies HistoryAnalysisData;
const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"] as const;
const monthDayCounts: Record<number, number> = { 4: 30, 5: 31, 6: 30, 7: 31 };
const monthStartOffsets: Record<number, number> = { 4: 3, 5: 5, 6: 1, 7: 3 };

function formatDmc(value: number) {
  return `${Math.abs(value).toLocaleString("ko-KR")} DMC`;
}

function formatSignedDmc(value: number) {
  return `${value > 0 ? "+" : "-"}${formatDmc(value)}`;
}

function mapLedgerTransaction(transaction: CustomerLedgerTransactionDto): HistoryTransaction {
  const direction = transaction.direction === "income" ? "income" : "expense";
  const amount = Math.abs(getLedgerRecordAmount(transaction));
  const label =
    getRecordText(transaction, ["title", "label", "description", "categoryLabel", "type"]) ?? "거래 내역";

  return {
    amount: direction === "income" ? amount : -amount,
    label,
    time: formatLedgerRelativeTime(transaction.occurredAt),
    type: direction,
  };
}

function mapLedgerAnalysis(analysis: CustomerLedgerAnalysisDto): HistoryAnalysisData {
  const mapCategory = (category: CustomerLedgerAnalysisDto["incomeCategories"][number]) => ({
    color: category.color || "#2563eb",
    label: category.label,
    value: ledgerAmountValue(category.value),
  });

  return {
    expenseCategories: analysis.expenseCategories.map(mapCategory),
    expenseTotal: ledgerAmountValue(analysis.expenseTotal),
    incomeCategories: analysis.incomeCategories.map(mapCategory),
    incomeTotal: ledgerAmountValue(analysis.incomeTotal),
  };
}

function mapLedgerCalendarEntry(entry: CustomerLedgerCalendarEntryDto): HistoryCalendarEntry {
  const mappedEntry: HistoryCalendarEntry = {
    day: entry.day,
  };

  if (entry.active !== undefined) {
    mappedEntry.active = entry.active;
  }

  if (entry.expense) {
    mappedEntry.expense = ledgerAmountValue(entry.expense);
  }

  if (entry.income) {
    mappedEntry.income = ledgerAmountValue(entry.income);
  }

  return mappedEntry;
}

function getCalendarCells(
  month: number,
  entries: readonly HistoryCalendarEntry[] = calendarEntries,
  useGeneratedFallback = true,
): HistoryCalendarEntry[] {
  const dayCount = monthDayCounts[month] ?? 30;
  const startOffset = monthStartOffsets[month] ?? 1;
  const monthEntries: HistoryCalendarEntry[] = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const seededEntry = entries.find((entry) => entry.day === day);

    if (month === 6 && seededEntry) {
      return seededEntry;
    }

    if (useGeneratedFallback && day % 7 === 2) {
      return { day, income: 900 + day * 30 };
    }

    if (useGeneratedFallback && day % 4 === 1) {
      return { day, expense: 400 + day * 74 };
    }

    return { day };
  });

  return [...Array.from({ length: startOffset }, () => ({ day: 0 })), ...monthEntries];
}

function CategoryPanel({
  categories,
  maxValue,
  title,
  totalLabel,
}: {
  categories: readonly HistoryCategory[];
  maxValue: number;
  title: string;
  totalLabel: string;
}) {
  return (
    <Surface asChild className="customer-history-category-card" padding="none">
      <section>
        <div className="customer-history-section-heading">
          <h2>{title}</h2>
          <span>{totalLabel}</span>
        </div>
        <div className="customer-history-category-chart">
          {categories.length > 0 ? (
            categories.map((category) => (
              <div
                className="customer-history-category-column"
                key={category.label}
                style={
                  {
                    "--customer-history-category-color": category.color,
                    "--customer-history-category-progress": `${(category.value / maxValue) * 100}%`,
                  } as CSSProperties
                }
              >
                <strong>{formatDmc(category.value)}</strong>
                <div className="customer-history-category-pillar">
                  <span aria-hidden="true" className="customer-history-category-pillar__fill" />
                </div>
                <span className="customer-history-category-label">{category.label}</span>
              </div>
            ))
          ) : (
            <div className="customer-history-empty">분석할 내역이 없습니다</div>
          )}
        </div>
      </section>
    </Surface>
  );
}

function HistoryCalendar({
  entries,
  month,
  onMonthChange,
  useGeneratedFallback,
}: {
  entries: readonly HistoryCalendarEntry[];
  month: number;
  onMonthChange: (month: number) => void;
  useGeneratedFallback: boolean;
}) {
  const cells = getCalendarCells(month, entries, useGeneratedFallback);

  return (
    <section aria-label={`${month}월 내역 달력`} className="customer-history-calendar-section">
      <div className="customer-history-month-control">
        <button
          aria-label="이전 달"
          onClick={() => {
            onMonthChange(month <= 4 ? 7 : month - 1);
          }}
          type="button"
        >
          <ChevronLeftIcon aria-hidden="true" />
        </button>
        <h2>{month}월</h2>
        <button
          aria-label="다음 달"
          onClick={() => {
            onMonthChange(month >= 7 ? 4 : month + 1);
          }}
          type="button"
        >
          <ChevronRightIcon aria-hidden="true" />
        </button>
      </div>

      <Surface asChild className="customer-history-calendar-card" padding="none">
        <div>
          <div className="customer-history-weekdays">
            {weekdayLabels.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="customer-history-calendar-grid">
            {cells.map((entry, index) =>
              entry.day === 0 ? (
                <span
                  aria-hidden="true"
                  className="customer-history-day customer-history-day--empty"
                  key={`empty-${index}`}
                />
              ) : (
                <div
                  className="customer-history-day"
                  data-active={"active" in entry && entry.active ? "true" : undefined}
                  key={`${entry.day}-${index}`}
                >
                  <strong>{entry.day}</strong>
                  {"expense" in entry && entry.expense ? (
                    <span className="customer-history-day__expense">
                      -{entry.expense.toLocaleString("ko-KR")}
                    </span>
                  ) : null}
                  {"income" in entry && entry.income ? (
                    <span className="customer-history-day__income">
                      +{entry.income.toLocaleString("ko-KR")}
                    </span>
                  ) : null}
                </div>
              ),
            )}
          </div>
        </div>
      </Surface>
    </section>
  );
}

function HistoryTransactionList({ transactions }: { transactions: readonly HistoryTransaction[] }) {
  return (
    <Surface asChild className="customer-history-transaction-card" padding="none">
      <section aria-label="거래 내역">
        <div className="customer-history-transaction-list">
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <div
                className="customer-history-transaction"
                key={`${transaction.label}-${transaction.time}`}
              >
                <div>
                  <span>
                    {transaction.type === "income" ? "적립" : "사용"} ㅣ {transaction.label}
                  </span>
                  <strong data-type={transaction.type}>
                    {formatSignedDmc(transaction.amount)}
                  </strong>
                </div>
                <span className="customer-history-transaction__time">{transaction.time}</span>
              </div>
            ))
          ) : (
            <div className="customer-history-empty">거래 내역이 없습니다</div>
          )}
        </div>
      </section>
    </Surface>
  );
}

function HistoryAnalysis({ analysis }: { analysis: HistoryAnalysisData }) {
  const largestExpenseValue = Math.max(
    ...analysis.expenseCategories.map((category) => category.value),
    1,
  );
  const largestIncomeValue = Math.max(
    ...analysis.incomeCategories.map((category) => category.value),
    1,
  );

  return (
    <div className="customer-history-analysis-stack">
      <Surface asChild className="customer-history-summary-card" padding="none">
        <section aria-label="6월 지출과 수입 요약">
          <dl>
            <div>
              <dt>지출</dt>
              <dd>{formatDmc(analysis.expenseTotal)}</dd>
            </div>
            <div>
              <dt>수입</dt>
              <dd>{formatDmc(analysis.incomeTotal)}</dd>
            </div>
          </dl>
        </section>
      </Surface>
      <div className="customer-history-category-grid">
        <CategoryPanel
          categories={analysis.expenseCategories}
          maxValue={largestExpenseValue}
          title="소비 카테고리"
          totalLabel={`지출 ${formatDmc(analysis.expenseTotal)}`}
        />
        <CategoryPanel
          categories={analysis.incomeCategories}
          maxValue={largestIncomeValue}
          title="수입 카테고리"
          totalLabel={`수입 ${formatDmc(analysis.incomeTotal)}`}
        />
      </div>
    </div>
  );
}

export function CustomerHistoryPage() {
  const isApiMode = isCustomerApiEnabled();
  const [activeView, setActiveView] = useState<HistoryView>("calendar");
  const [activeMonth, setActiveMonth] = useState(6);
  const [apiCalendarEntries, setApiCalendarEntries] = useState<HistoryCalendarEntry[] | undefined>(
    () => (isApiMode ? [] : undefined),
  );
  const [apiTransactions, setApiTransactions] = useState<HistoryTransaction[] | undefined>(() =>
    isApiMode ? [] : undefined,
  );
  const [apiAnalysis, setApiAnalysis] = useState<HistoryAnalysisData | undefined>(() =>
    isApiMode ? emptyHistoryAnalysis : undefined,
  );

  useEffect(() => {
    if (!isCustomerApiEnabled()) {
      return;
    }

    let isCancelled = false;
    const month = `2026-${String(activeMonth).padStart(2, "0")}`;

    void Promise.all([
      fetchCustomerLedgerCalendar(month),
      fetchCustomerLedgerTransactions(),
      fetchCustomerLedgerAnalysis(month),
    ])
      .then(([calendar, transactions, analysis]) => {
        if (isCancelled) {
          return;
        }

        const mappedAnalysis = mapLedgerAnalysis(analysis);

        setApiCalendarEntries(calendar.map(mapLedgerCalendarEntry));
        setApiTransactions(transactions.map(mapLedgerTransaction));
        setApiAnalysis(mappedAnalysis);
      })
      .catch(() => {
        if (!isCancelled) {
          setApiCalendarEntries([]);
          setApiTransactions([]);
          setApiAnalysis(emptyHistoryAnalysis);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeMonth]);

  const calendarEntrySource = isApiMode ? (apiCalendarEntries ?? []) : calendarEntries;
  const transactionSource = isApiMode ? (apiTransactions ?? []) : historyTransactions;
  const analysisSource = isApiMode ? (apiAnalysis ?? emptyHistoryAnalysis) : staticHistoryAnalysis;

  return (
    <div className="customer-history-page" data-view={activeView}>
      <AppHeader />

      <header className="customer-history-header">
        <h1>{activeMonth}월 내역</h1>
      </header>

      <div className="customer-history-tabs" role="tablist" aria-label="내역 보기 방식">
        {historyTabs.map((tab) => (
          <button
            aria-selected={activeView === tab.id}
            data-active={activeView === tab.id ? "true" : undefined}
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id);
            }}
            role="tab"
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="customer-panel-transition" key={activeView}>
        {activeView === "calendar" ? (
          <HistoryCalendar
            entries={calendarEntrySource}
            month={activeMonth}
            onMonthChange={setActiveMonth}
            useGeneratedFallback={!isApiMode}
          />
        ) : null}
        {activeView === "transactions" ? (
          <HistoryTransactionList transactions={transactionSource} />
        ) : null}
        {activeView === "analysis" ? <HistoryAnalysis analysis={analysisSource} /> : null}
      </div>
    </div>
  );
}
