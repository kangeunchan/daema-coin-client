import { customerApiRequest } from "./client";

export type CustomerLedgerAmountDto = {
  currency?: string;
  formatted?: string;
  value?: number;
};

export type CustomerLedgerCalendarEntryDto = {
  active?: boolean;
  date: string;
  day: number;
  expense?: CustomerLedgerAmountDto;
  income?: CustomerLedgerAmountDto;
};

export type CustomerLedgerCategoryDto = {
  color?: string;
  id?: string;
  label: string;
  value: CustomerLedgerAmountDto;
};

export type CustomerLedgerAnalysisDto = {
  expenseCategories: CustomerLedgerCategoryDto[];
  expenseTotal: CustomerLedgerAmountDto;
  incomeCategories: CustomerLedgerCategoryDto[];
  incomeTotal: CustomerLedgerAmountDto;
  month: string;
};

export type CustomerLedgerTransactionDto = Record<string, unknown> & {
  amount?: CustomerLedgerAmountDto | number;
  categoryLabel?: string;
  direction?: "expense" | "income" | string;
  occurredAt?: string;
  title?: string;
  type?: string;
};

export async function fetchCustomerLedgerCalendar(month: string) {
  return customerApiRequest<CustomerLedgerCalendarEntryDto[]>(
    `/customer/ledger/calendar?month=${encodeURIComponent(month)}`,
  );
}

export async function fetchCustomerLedgerTransactions() {
  return customerApiRequest<CustomerLedgerTransactionDto[]>("/customer/ledger/transactions");
}

export async function fetchCustomerLedgerRecent() {
  return customerApiRequest<CustomerLedgerTransactionDto[]>("/customer/ledger/recent");
}

export async function fetchCustomerLedgerAnalysis(month: string) {
  return customerApiRequest<CustomerLedgerAnalysisDto>(
    `/customer/ledger/analysis?month=${encodeURIComponent(month)}`,
  );
}
