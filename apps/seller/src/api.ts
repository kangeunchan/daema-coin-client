import { JsonApiError, requestJsonApi } from "@daema/shared";
import type { JsonApiRequestOptions } from "@daema/shared";

export class SellerApiError extends JsonApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, { code, name: "SellerApiError" });
  }
}

export type SellerMe = {
  boothId?: string;
  displayName?: string;
  id?: string;
  loginId?: string;
  roles?: string[];
};

export type SellerBooth = Record<string, unknown> & {
  id?: string;
  locationLabel?: string;
  name?: string;
  status?: string;
};

export type SellerDashboard = {
  orderCount?: number;
  paymentCount?: number;
  productCount?: number;
  revenue?: {
    formatted?: string;
    value?: number;
  };
};

export const sellerApiBaseUrl =
  import.meta.env.VITE_SELLER_API_BASE_URL?.replace(/\/$/, "") ??
  import.meta.env.VITE_DAEMA_API_BASE_URL?.replace(/\/$/, "") ??
  "";

export function isSellerApiEnabled() {
  if (import.meta.env.MODE === "test") {
    return true;
  }

  return sellerApiBaseUrl.length > 0;
}

async function sellerApiRequest<TResponse>(path: string, options: JsonApiRequestOptions = {}) {
  if (!sellerApiBaseUrl) {
    throw new SellerApiError("Seller API base URL is not configured.", 0);
  }

  return requestJsonApi<TResponse, SellerApiError>({
    baseUrl: sellerApiBaseUrl,
    createError: ({ code, message, status }) => new SellerApiError(message, status, code),
    defaultErrorMessage: "Seller API request failed.",
    options,
    path,
  });
}

export async function loginSeller(loginId: string, password: string) {
  return sellerApiRequest<{ user?: SellerMe }>("/auth/seller/login", {
    body: { loginId, password },
    method: "POST",
  });
}

export async function fetchSellerMe() {
  return sellerApiRequest<SellerMe>("/seller/me");
}

export async function logoutSeller() {
  return sellerApiRequest<{ loggedOut: boolean }>("/auth/seller/logout", { method: "POST" });
}

export async function fetchSellerBooths() {
  return sellerApiRequest<SellerBooth[]>("/seller/booths");
}

export async function fetchSellerDashboard(boothId: string) {
  return sellerApiRequest<SellerDashboard>(
    `/seller/booths/${encodeURIComponent(boothId)}/dashboard`,
  );
}
