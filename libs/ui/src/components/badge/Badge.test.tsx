import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Badge } from "./Badge";

test("renders badge variants", () => {
  const html = renderToStaticMarkup(
    <Badge intent="brand" size="sm">
      Active
    </Badge>,
  );

  expect(html).toContain("daema-ui-badge--intent-brand");
  expect(html).toContain("daema-ui-badge--size-sm");
});

test("composes badge onto a child", () => {
  const html = renderToStaticMarkup(
    <Badge asChild intent="success">
      <strong>Verified</strong>
    </Badge>,
  );

  expect(html).toContain("<strong");
  expect(html).toContain("daema-ui-badge");
});
