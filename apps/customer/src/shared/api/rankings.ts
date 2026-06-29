import { customerApiRequest } from "./client";
import type { CustomerLedgerAmountDto } from "./ledger";

export type CustomerRankingDto = Record<string, unknown> & {
  amount?: CustomerLedgerAmountDto | number;
  avatarUrl?: string;
  balance?: CustomerLedgerAmountDto | number;
  displayName?: string;
  githubLogin?: string;
  name?: string;
  points?: CustomerLedgerAmountDto | number;
  rank?: number;
  score?: CustomerLedgerAmountDto | number;
  totalPoint?: CustomerLedgerAmountDto | number;
};

export async function fetchCustomerUserRankings() {
  return customerApiRequest<CustomerRankingDto[]>("/customer/rankings?type=user");
}
