export class CustomerApiError extends Error {
  readonly code: string | undefined;
  readonly details: unknown;
  readonly status: number;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "CustomerApiError";
    this.status = status;
  }
}

type CustomerApiEnvelope<TResponse> = {
  data: TResponse;
  meta?: unknown;
};

type CustomerApiErrorEnvelope = {
  error?: {
    code?: string;
    details?: unknown;
    message?: string;
  };
};

type CustomerApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export const customerApiBaseUrl = import.meta.env.VITE_CUSTOMER_API_BASE_URL?.replace(/\/$/, "") ?? "";

export function isCustomerApiEnabled() {
  if (import.meta.env.MODE === "test") {
    return false;
  }

  return customerApiBaseUrl.length > 0;
}

export async function customerApiRequest<TResponse>(
  path: string,
  options: CustomerApiRequestOptions = {},
) {
  if (!isCustomerApiEnabled()) {
    throw new CustomerApiError("Customer API base URL is not configured.", 0);
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

  const response = await fetch(`${customerApiBaseUrl}${path}`, requestInit);
  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText.length > 0 ? (JSON.parse(responseText) as unknown) : undefined;
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const errorPayload = payload as CustomerApiErrorEnvelope | undefined;
    const error = errorPayload?.error;

    throw new CustomerApiError(
      error?.message || response.statusText || "Customer API request failed.",
      response.status,
      error?.code,
      error?.details,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as CustomerApiEnvelope<TResponse>).data;
  }

  return payload as TResponse;
}
