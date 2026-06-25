export class SellerApiError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.name = "SellerApiError";
    this.status = status;
  }
}

type ApiEnvelope<TResponse> = {
  data: TResponse;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
  };
};

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

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

async function sellerApiRequest<TResponse>(path: string, options: ApiRequestOptions = {}) {
  if (!sellerApiBaseUrl) {
    throw new SellerApiError("Seller API base URL is not configured.", 0);
  }

  const { body, ...requestOptions } = options;
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const requestInit: RequestInit = {
    ...requestOptions,
    credentials: "include",
    headers,
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${sellerApiBaseUrl}${path}`, requestInit);
  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const error = (payload as ApiErrorEnvelope | undefined)?.error;

    throw new SellerApiError(
      error?.message || response.statusText || "Seller API request failed.",
      response.status,
      error?.code,
    );
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<TResponse>).data;
  }

  return payload as TResponse;
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
