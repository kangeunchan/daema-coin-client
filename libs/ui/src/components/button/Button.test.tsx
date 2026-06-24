import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  test("renders a typed button by default", () => {
    const html = renderToStaticMarkup(<Button size="lg">Pay now</Button>);

    expect(html).toContain('type="button"');
    expect(html).toContain("daema-ui-button--intent-primary");
    expect(html).toContain("daema-ui-button--size-lg");
  });

  test("composes props onto a child element", () => {
    const html = renderToStaticMarkup(
      <Button asChild intent="secondary">
        <a href="/wallet">Wallet</a>
      </Button>,
    );

    expect(html).toContain("<a");
    expect(html).toContain('href="/wallet"');
    expect(html).toContain("daema-ui-button--intent-secondary");
  });

  test("exposes loading state accessibly", () => {
    const html = renderToStaticMarkup(<Button loading>Submit</Button>);

    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("daema-ui-button__spinner");
    expect(html).toContain("Loading");
  });
});
