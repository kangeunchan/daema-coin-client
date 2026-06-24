import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { IconButton } from "./IconButton";

describe("IconButton", () => {
  test("requires an accessible name at type level and renders it", () => {
    const html = renderToStaticMarkup(
      <IconButton aria-label="Search" intent="ghost">
        <svg />
      </IconButton>,
    );

    expect(html).toContain('aria-label="Search"');
    expect(html).toContain("daema-ui-icon-button--intent-ghost");
  });
});
