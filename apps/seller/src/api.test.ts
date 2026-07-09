import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

test("requests the maximum product list size for seller inventory", async () => {
  vi.stubEnv("VITE_SELLER_API_BASE_URL", "https://api.example.test");
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: [] })));
  vi.stubGlobal("fetch", fetchMock);

  const { fetchSellerProducts } = await import("./api");

  await fetchSellerProducts("booth-1");

  expect(fetchMock).toHaveBeenCalledWith(
    "https://api.example.test/seller/booths/booth-1/products?limit=1000",
    expect.objectContaining({ credentials: "include" }),
  );
});
