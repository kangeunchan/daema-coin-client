import { JsonApiError, requestJsonApi } from "@daema/shared";
import type { JsonApiRequestOptions } from "@daema/shared";

export class AdminApiError extends JsonApiError {
  constructor(message: string, status: number, code?: string) {
    super(message, status, { code, name: "AdminApiError" });
  }
}

export type AdminUser = {
  accessToken?: string;
  account?: InternalAccount;
  expiresAt?: string;
  role?: string;
  tokenType?: string;
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
  createdAt?: string;
  createdBy?: string;
  displayName?: string;
  forcePasswordChange?: boolean;
  id: string;
  lastLoginAt?: string;
  loginId: string;
  role: "admin" | "booth" | "teacher" | string;
  status: "active" | "disabled" | "locked" | string;
  updatedAt?: string;
};

export type AdminDashboard = {
  boothCount?: number;
  festivalCount?: number;
  orderCount?: number;
  userCount?: number;
};

export type AdminBooth = Record<string, unknown> & {
  boothId?: string;
  categoryId?: string;
  createdAt?: string;
  description?: string;
  festivalId?: string;
  id?: string;
  locationLabel?: string;
  name?: string;
  sellerId?: string;
  status?: string;
  updatedAt?: string;
};

export type AdminRole = Record<string, unknown> & {
  code?: string;
  description?: string;
  id?: string;
  name?: string;
  role?: string;
  status?: string;
};

const adminAccessTokenStorageKey = "daema.admin.accessToken";

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

function readAdminAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(adminAccessTokenStorageKey) ?? "";
}

function writeAdminAccessToken(token: string | undefined) {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem(adminAccessTokenStorageKey, token);
    return;
  }

  window.localStorage.removeItem(adminAccessTokenStorageKey);
}

export function clearAdminAccessToken() {
  writeAdminAccessToken(undefined);
}

async function adminApiRequest<TResponse>(path: string, options: JsonApiRequestOptions = {}) {
  if (!adminApiBaseUrl) {
    throw new AdminApiError("Admin API base URL is not configured.", 0);
  }

  const headers = new Headers(options.headers);
  const token = readAdminAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return requestJsonApi<TResponse, AdminApiError>({
    baseUrl: adminApiBaseUrl,
    createError: ({ code, message, status }) => new AdminApiError(message, status, code),
    defaultErrorMessage: "Admin API request failed.",
    options: { ...options, headers },
    path,
  });
}

export async function loginAdmin(loginId: string, password: string) {
  const session = await adminApiRequest<AdminUser>("/auth/admin/login", {
    body: { loginId, password },
    method: "POST",
  });
  writeAdminAccessToken(session.accessToken);
  return session;
}

export async function fetchAdminMe() {
  try {
    return await adminApiRequest<AdminUser>("/auth/me");
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      clearAdminAccessToken();
    }
    throw error;
  }
}

export async function logoutAdmin() {
  try {
    return await adminApiRequest<{ loggedOut: boolean }>("/auth/logout", { method: "POST" });
  } finally {
    clearAdminAccessToken();
  }
}

export async function fetchInternalAccounts() {
  return adminApiRequest<InternalAccount[]>("/admin/accounts");
}

export async function fetchAdminDashboard() {
  return adminApiRequest<AdminDashboard>("/admin/dashboard");
}

export async function fetchAdminBooths() {
  return adminApiRequest<AdminBooth[]>("/admin/booths");
}

export async function createAdminBooth(input: {
  boothId?: string;
  categoryId?: string;
  description?: string;
  festivalId?: string;
  locationLabel?: string;
  name: string;
  status?: string;
}) {
  return adminApiRequest<AdminBooth>("/admin/booths", {
    body: input,
    method: "POST",
  });
}

export async function updateAdminBooth(boothId: string, input: Record<string, unknown>) {
  return adminApiRequest<AdminBooth>(`/admin/booths/${encodeURIComponent(boothId)}`, {
    body: input,
    method: "PATCH",
  });
}

export async function fetchAdminRoles() {
  return adminApiRequest<AdminRole[]>("/admin/roles");
}

export async function createRoleAssignment(input: {
  accountId?: string;
  boothId?: string;
  roleId: string;
  scope?: string;
}) {
  return adminApiRequest<Record<string, unknown>>("/admin/role-assignments", {
    body: input,
    method: "POST",
  });
}

export async function createInternalAccount(input: {
  boothId?: string;
  displayName?: string;
  forcePasswordChange?: boolean;
  loginId: string;
  password: string;
  role: "admin" | "booth" | "teacher";
}) {
  return adminApiRequest<InternalAccount>("/admin/accounts", {
    body: input,
    method: "POST",
  });
}

export async function updateInternalAccount(
  accountId: string,
  input: {
    boothId?: string;
    displayName?: string;
    forcePasswordChange?: boolean;
    status?: "active" | "disabled" | "locked";
  },
) {
  return adminApiRequest<InternalAccount>(`/admin/accounts/${encodeURIComponent(accountId)}`, {
    body: input,
    method: "PATCH",
  });
}

export async function resetInternalAccountPassword(accountId: string, password: string) {
  return adminApiRequest<InternalAccount>(
    `/admin/accounts/${encodeURIComponent(accountId)}/reset-password`,
    {
      body: { password },
      method: "POST",
    },
  );
}
