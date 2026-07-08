import { expect, test } from "vitest";

import { formatDmc, getProductIdFromPathname } from "./boothContent";

test("extracts booth product id from route pathnames", () => {
  expect(getProductIdFromPathname("/booth/portable-fan")).toBe("portable-fan");
  expect(getProductIdFromPathname("/booth/%ED%85%8C%EC%8A%A4%ED%8A%B8")).toBe("테스트");
  expect(getProductIdFromPathname("/pay")).toBeUndefined();
});

test("formats product prices as DMC labels", () => {
  expect(formatDmc(2480)).toBe("2,480 DMC");
});
