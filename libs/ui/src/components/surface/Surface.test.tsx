import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Surface } from "./Surface";

test("renders a tokenized surface", () => {
  const html = renderToStaticMarkup(<Surface aria-label="Panel" tone="glass" />);

  expect(html).toContain('aria-label="Panel"');
  expect(html).toContain("daema-ui-surface--tone-glass");
});

test("composes surface onto a child", () => {
  const html = renderToStaticMarkup(
    <Surface asChild padding="none">
      <article aria-label="Report" />
    </Surface>,
  );

  expect(html).toContain("<article");
  expect(html).toContain("daema-ui-surface--padding-none");
});
