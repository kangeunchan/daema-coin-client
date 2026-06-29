import { afterEach, expect, test, vi } from "vitest";

import { requestJsonApi } from "./jsonApiClient";
import type { JsonApiError } from "./jsonApiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

test("unwraps data envelopes and sends json bodies", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ data: { ok: true } }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = await requestJsonApi<{ ok: boolean }>({
    baseUrl: "https://api.example.test",
    defaultErrorMessage: "Request failed.",
    options: {
      body: { value: 1 },
      method: "POST",
    },
    path: "/items",
  });

  expect(result).toEqual({ ok: true });
  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.example.test/items",
    expect.objectContaining({
      body: JSON.stringify({ value: 1 }),
      credentials: "include",
      method: "POST",
    }),
  );
});

test("throws JsonApiError with envelope details", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: "bad_request",
            details: { field: "loginId" },
            message: "Bad request",
          },
        }),
        {
          status: 400,
          statusText: "Bad Request",
        },
      ),
    ),
  );

  await expect(
    requestJsonApi({
      baseUrl: "https://api.example.test",
      defaultErrorMessage: "Request failed.",
      path: "/items",
    }),
  ).rejects.toMatchObject({
    code: "bad_request",
    details: { field: "loginId" },
    message: "Bad request",
    status: 400,
  } satisfies Partial<JsonApiError>);
});
