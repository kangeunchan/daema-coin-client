import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("renders the booth account login", async () => {
  render(<App />);

  expect(await screen.findByLabelText("부스 로그인")).toBeVisible();
  expect(screen.getByText("부스 계정 로그인")).toBeVisible();
});
