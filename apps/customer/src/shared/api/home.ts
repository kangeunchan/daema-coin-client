import { customerApiRequest } from "./client";
import type { CustomerLedgerTransactionDto } from "./ledger";

export type CustomerHomeWalletBalanceDto = Record<string, unknown> & {
  amount?: { formatted?: string; value?: number } | number;
  balance?: { formatted?: string; value?: number } | number;
  currency?: string;
  label?: string;
  name?: string;
};

export type CustomerHomeDto = {
  recentTransactions?: CustomerLedgerTransactionDto[];
  wallet?: {
    balances?: CustomerHomeWalletBalanceDto[];
  };
};

export async function fetchCustomerHome() {
  return customerApiRequest<CustomerHomeDto>("/customer/home");
}
