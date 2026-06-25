import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";

test("renders the internal admin login", async () => {
  render(<App />);

  expect(await screen.findByLabelText("관리자 로그인")).toBeVisible();
  expect(screen.getByText("관리자 로그인")).toBeVisible();
});
