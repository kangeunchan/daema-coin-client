import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Divider } from "./Divider";

test("renders a horizontal separator by default", () => {
  const html = renderToStaticMarkup(<Divider />);

  expect(html).toContain('role="separator"');
  expect(html).toContain("daema-ui-divider--horizontal");
});

test("renders vertical orientation", () => {
  const html = renderToStaticMarkup(<Divider orientation="vertical" />);

  expect(html).toContain('aria-orientation="vertical"');
});
