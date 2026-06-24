import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card";

describe("Card", () => {
  test("renders the composition classes", () => {
    const html = renderToStaticMarkup(
      <Card tone="glass">
        <CardHeader>
          <CardTitle>Balance</CardTitle>
          <CardDescription>Updated just now</CardDescription>
        </CardHeader>
        <CardContent>12,480 DMC</CardContent>
      </Card>,
    );

    expect(html).toContain("daema-ui-card--tone-glass");
    expect(html).toContain("daema-ui-card__header");
    expect(html).toContain("daema-ui-card__title");
    expect(html).toContain("12,480 DMC");
  });
});
