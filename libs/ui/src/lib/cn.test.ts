import { describe, expect, test } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  test("merges conditional classes and resolves Tailwind conflicts", () => {
    const isHidden = false;

    expect(cn("px-2", isHidden && "hidden", ["px-4", "text-sm"])).toBe("px-4 text-sm");
  });
});
