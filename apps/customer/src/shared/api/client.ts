import { JsonApiError, requestJsonApi } from "@daema/shared";
import type { JsonApiRequestOptions } from "@daema/shared";

export class CustomerApiError extends JsonApiError {
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message, status, { code, details, name: "CustomerApiError" });
  }
}

export const customerApiBaseUrl = import.meta.env.VITE_CUSTOMER_API_BASE_URL?.replace(/\/$/, "") ?? "";
export const teacherAccessTokenStorageKey = "daema.teacher.accessToken";

export function isCustomerApiEnabled() {
  if (import.meta.env.MODE === "test") {
    return false;
  }

  return customerApiBaseUrl.length > 0;
}

export async function customerApiRequest<TResponse>(
  path: string,
  options: JsonApiRequestOptions = {},
) {
  if (!isCustomerApiEnabled()) {
    throw new CustomerApiError("Customer API base URL is not configured.", 0);
  }

  const headers = new Headers(options.headers);
  const teacherToken =
    typeof window === "undefined"
      ? ""
      : window.localStorage.getItem(teacherAccessTokenStorageKey) ?? "";
  if (teacherToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${teacherToken}`);
  }

  return requestJsonApi<TResponse, CustomerApiError>({
    baseUrl: customerApiBaseUrl,
    createError: ({ code, details, message, status }) =>
      new CustomerApiError(message, status, code, details),
    defaultErrorMessage: "Customer API request failed.",
    options: { ...options, headers },
    path,
  });
}
