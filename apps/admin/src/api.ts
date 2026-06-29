import { JsonApiError, requestJsonApi } from "@daema/shared";
import type { JsonApiRequestOptions } from "@daema/shared";

export class AdminApiError extends JsonApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, { code, name: "AdminApiError" });
  }
}

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

async function adminApiRequest<TResponse>(path: string, options: JsonApiRequestOptions = {}) {
  if (!adminApiBaseUrl) {
    throw new AdminApiError("Admin API base URL is not configured.", 0);
  }

  return requestJsonApi<TResponse, AdminApiError>({
    baseUrl: adminApiBaseUrl,
    createError: ({ code, message, status }) => new AdminApiError(message, status, code),
    defaultErrorMessage: "Admin API request failed.",
    options,
    path,
  });
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
