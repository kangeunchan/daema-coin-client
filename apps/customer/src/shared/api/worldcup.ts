import { customerApiRequest } from "./client";

export type CustomerWorldcupTeamDto = {
  countryCode?: string;
  id?: string;
  logo?: string;
  name: string;
  score?: number | null;
};

export type CustomerWorldcupMatchDto = {
  away: CustomerWorldcupTeamDto;
  displayTime?: string;
  externalId?: number;
  home: CustomerWorldcupTeamDto;
  id: string;
  matchDayId?: string;
  startsAt?: string;
  status: string;
  statusLabel?: string;
  subtitle?: string;
};

export type CustomerWorldcupMatchDayDto = {
  badge?: string;
  date: string;
  id: string;
  isActive?: boolean;
  label: string;
  matches: CustomerWorldcupMatchDto[];
};

export type CustomerWorldcupPredictionPick = "away" | "draw" | "home";

export type CustomerWorldcupPredictionSummaryDto = {
  awayPercent: number;
  canCancel?: boolean;
  canPredict: boolean;
  drawPercent: number;
  homePercent: number;
  matchId: string;
  matchStatus?: string;
  matchStatusLabel?: string;
  myPrediction: CustomerWorldcupPredictionPick | null;
  myStakeAmount?: number | null;
  totalCount: number;
  totalStakeAmount?: number;
};

export type CustomerWorldcupMatchMetricDto = {
  away: number;
  awayDisplay?: string;
  home: number;
  homeDisplay?: string;
  key?: string;
  label: string;
};

export type CustomerWorldcupLineupPlayerDto = {
  id?: string;
  name: string;
  number?: number;
  position?: string;
};

export type CustomerWorldcupLineupDto = {
  coach?: string;
  formation?: string;
  players?: CustomerWorldcupLineupPlayerDto[];
  teamId?: string;
};

export async function fetchCustomerWorldcupMatchDays() {
  return customerApiRequest<CustomerWorldcupMatchDayDto[]>("/customer/worldcup/match-days");
}

export async function fetchCustomerWorldcupMatch(matchId: string) {
  return customerApiRequest<CustomerWorldcupMatchDto>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}`,
  );
}

export async function fetchCustomerWorldcupPredictionSummary(matchId: string) {
  return customerApiRequest<CustomerWorldcupPredictionSummaryDto>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}/predictions/summary`,
  );
}

export async function fetchCustomerWorldcupStats(matchId: string) {
  return customerApiRequest<CustomerWorldcupMatchMetricDto[]>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}/stats`,
  );
}

export async function fetchCustomerWorldcupLineups(matchId: string) {
  return customerApiRequest<CustomerWorldcupLineupDto[]>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}/lineups`,
  );
}

export async function createCustomerWorldcupPrediction(
  matchId: string,
  pick: CustomerWorldcupPredictionPick,
  stakeAmount: number,
) {
  return customerApiRequest<unknown>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}/predictions`,
    {
      body: { pick, stakeAmount },
      method: "POST",
    },
  );
}

export async function cancelCustomerWorldcupPrediction(matchId: string) {
  return customerApiRequest<unknown>(
    `/customer/worldcup/matches/${encodeURIComponent(matchId)}/predictions`,
    {
      method: "DELETE",
    },
  );
}
