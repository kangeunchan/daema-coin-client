import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("renders the admin app scaffold", () => {
  render(<App />);

  expect(screen.getByLabelText("Admin app scaffold")).toBeVisible();
  expect(screen.getByText("Admin App")).toBeVisible();
});
