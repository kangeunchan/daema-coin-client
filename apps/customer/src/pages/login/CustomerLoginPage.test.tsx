import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { CustomerApiError } from "../../shared/api/client";
import { CustomerLoginPage } from "./CustomerLoginPage";

afterEach(cleanup);

test("shows a duplicate student number error", async () => {
  const onLogin = vi
    .fn()
    .mockRejectedValue(
      new CustomerApiError(
        "이미 등록된 학번입니다.",
        409,
        "STUDENT_NUMBER_ALREADY_REGISTERED",
      ),
    );

  render(
    <CustomerLoginPage
      initialStep="profile"
      onGithubAuthenticated={vi.fn()}
      onLogin={onLogin}
      onRestartGithubAuthentication={vi.fn()}
    />,
  );

  fireEvent.change(screen.getByLabelText("학번"), { target: { value: "20240001" } });
  fireEvent.change(screen.getByLabelText("이름"), { target: { value: "테스트" } });
  fireEvent.click(screen.getByRole("button", { name: "학생 정보 확인하기" }));

  expect(await screen.findByText("이미 등록된 학번이에요.")).toBeVisible();
  expect(onLogin).toHaveBeenCalledWith({ name: "테스트", studentNo: "20240001" });
});
