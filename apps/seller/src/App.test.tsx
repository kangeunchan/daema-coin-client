import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("renders the seller app scaffold", () => {
  render(<App />);

  expect(screen.getByLabelText("Seller app scaffold")).toBeVisible();
  expect(screen.getByText("Seller App")).toBeVisible();
});
