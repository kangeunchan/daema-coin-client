import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Skeleton } from "./Skeleton";

test("renders an inert skeleton", () => {
  const html = renderToStaticMarkup(<Skeleton shape="text" />);

  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain("daema-ui-skeleton--shape-text");
});
