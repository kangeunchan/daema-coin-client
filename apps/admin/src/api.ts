export class AdminApiError extends Error {
  readonly code: string | undefined;
  readonly status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.code = code;
    this.name = "AdminApiError";
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

export type AdminUser = {
  expiresAt?: string;
  role?: string;
  user?: {
    accountId?: string;
    id?: string;
    login?: string;
    name?: string;
    roles?: string[];
  };
};

export type InternalAccount = {
  boothId?: string;
  displayName?: string;
  forcePasswordChange?: boolean;
  id: string;
  lastLoginAt?: string;
  loginId: string;
  role: "admin" | "booth" | string;
  status: "active" | "disabled" | "locked" | string;
};

export const adminApiBaseUrl =
  import.meta.env.VITE_ADMIN_API_BASE_URL?.replace(/\/$/, "") ??
  import.meta.env.VITE_DAEMA_API_BASE_URL?.replace(/\/$/, "") ??
  "";

export function isAdminApiEnabled() {
  if (import.meta.env.MODE === "test") {
    return true;
  }

  return adminApiBaseUrl.length > 0;
}

async function adminApiRequest<TResponse>(path: string, options: ApiRequestOptions = {}) {
  if (!adminApiBaseUrl) {
    throw new AdminApiError("Admin API base URL is not configured.", 0);
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

  const response = await fetch(`${adminApiBaseUrl}${path}`, requestInit);
  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText ? JSON.parse(responseText) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const error = (payload as ApiErrorEnvelope | undefined)?.error;

    throw new AdminApiError(
      error?.message || response.statusText || "Admin API request failed.",
      response.status,
      error?.code,
    );
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<TResponse>).data;
  }

  return payload as TResponse;
}

export async function loginAdmin(loginId: string, password: string) {
  return adminApiRequest<AdminUser>("/auth/admin/login", {
    body: { loginId, password },
    method: "POST",
  });
}

export async function fetchAdminMe() {
  return adminApiRequest<AdminUser>("/auth/me");
}

export async function logoutAdmin() {
  return adminApiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
}

export async function fetchInternalAccounts() {
  return adminApiRequest<InternalAccount[]>("/admin/accounts");
}

export async function createInternalAccount(input: {
  boothId?: string;
  displayName?: string;
  forcePasswordChange?: boolean;
  loginId: string;
  password: string;
  role: "admin" | "booth";
}) {
  return adminApiRequest<InternalAccount>("/admin/accounts", {
    body: input,
    method: "POST",
  });
}
