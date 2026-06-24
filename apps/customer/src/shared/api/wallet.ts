import { customerApiRequest } from "./client";
import type { CustomerLedgerAmountDto } from "./ledger";

export type CustomerWalletBalanceDto = Record<string, unknown> & {
  amount?: CustomerLedgerAmountDto | number;
  balance?: CustomerLedgerAmountDto | number;
  currency?: string;
  label?: string;
  name?: string;
};

export type CustomerWalletBalancesDto = {
  balances: CustomerWalletBalanceDto[];
};

export async function fetchCustomerWalletBalances() {
  return customerApiRequest<CustomerWalletBalancesDto>("/customer/wallet/balances");
}
