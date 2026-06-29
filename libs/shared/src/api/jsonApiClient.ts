export class JsonApiError extends Error {
  readonly code: string | undefined;
  readonly details: unknown;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    options: {
      code?: string | undefined;
      details?: unknown;
      name?: string | undefined;
    } = {},
  ) {
    super(message);
    this.code = options.code;
    this.details = options.details;
    this.name = options.name ?? "JsonApiError";
    this.status = status;
  }
}

type JsonApiEnvelope<TResponse> = {
  data: TResponse;
  meta?: unknown;
};

type JsonApiErrorEnvelope = {
  error?: {
    code?: string;
    details?: unknown;
    message?: string;
  };
};

export type JsonApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type JsonApiRequestConfig<TError extends JsonApiError = JsonApiError> = {
  baseUrl: string;
  defaultErrorMessage: string;
  path: string;
  createError?: (input: {
    code?: string | undefined;
    details?: unknown;
    message: string;
    status: number;
  }) => TError;
  options?: JsonApiRequestOptions;
};

function parseJsonPayload(responseText: string) {
  if (responseText.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return undefined;
  }
}

function readErrorEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  return (payload as JsonApiErrorEnvelope).error;
}

function readDataEnvelope<TResponse>(payload: unknown) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as JsonApiEnvelope<TResponse>).data;
  }

  return payload as TResponse;
}

export async function requestJsonApi<TResponse, TError extends JsonApiError = JsonApiError>({
  baseUrl,
  createError,
  defaultErrorMessage,
  options = {},
  path,
}: JsonApiRequestConfig<TError>) {
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

  const response = await fetch(`${baseUrl}${path}`, requestInit);
  const payload = parseJsonPayload(await response.text());

  if (!response.ok) {
    const error = readErrorEnvelope(payload);
    const message = error?.message || response.statusText || defaultErrorMessage;

    throw createError
      ? createError({
          code: error?.code,
          details: error?.details,
          message,
          status: response.status,
        })
      : new JsonApiError(message, response.status, {
          code: error?.code,
          details: error?.details,
        });
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return readDataEnvelope<TResponse>(payload);
}
