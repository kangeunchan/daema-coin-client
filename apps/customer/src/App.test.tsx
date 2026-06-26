import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { App } from "./App";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-26T00:00:00+09:00"));
  window.localStorage.removeItem("daema-customer-auth");
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test("renders the mobile web app width range", () => {
  render(<App />);

  expect(screen.getByLabelText("Mobile web app width range")).toBeVisible();
  expect(screen.getByRole("button", { name: "GitHub로 로그인" })).toBeVisible();
});

async function login() {
  fireEvent.click(screen.getByRole("button", { name: "GitHub로 로그인" }));
  fireEvent.change(await screen.findByLabelText("학번"), { target: { value: "20240001" } });
  fireEvent.change(screen.getByLabelText("이름"), { target: { value: "강은찬" } });
  fireEvent.click(screen.getByRole("button", { name: "학생 정보 확인하기" }));
  await screen.findByRole("link", { name: "내역 상세 보기" });
}

test("moves between customer tab pages", async () => {
  render(<App />);
  await login();

  fireEvent.click(screen.getByRole("link", { name: "내역 상세 보기" }));

  expect(window.location.pathname).toBe("/history");
  expect(screen.getByRole("heading", { name: "6월 내역" })).toBeVisible();

  fireEvent.click(screen.getByRole("link", { name: "페이" }));

  expect(window.location.pathname).toBe("/pay");

  fireEvent.click(screen.getByRole("link", { name: "홈" }));

  expect(window.location.pathname).toBe("/");

  fireEvent.click(screen.getByRole("link", { name: "페이" }));

  expect(window.location.pathname).toBe("/pay");
  expect(screen.getByRole("link", { current: "page", name: "페이" })).toBeVisible();

  fireEvent.click(screen.getByRole("link", { name: "전체" }));

  expect(window.location.pathname).toBe("/all");
  expect(screen.getByRole("link", { current: "page", name: "전체" })).toBeVisible();
  expect(screen.getByText("사용 중인 기능")).toBeVisible();
  expect(screen.getByRole("link", { name: "바코드 결제" })).toBeVisible();

  fireEvent.click(screen.getByRole("link", { name: "월드컵 승부예측" }));

  expect(window.location.pathname).toBe("/points/worldcup");
  expect(screen.getByRole("region", { name: "월드컵 포인트" })).toBeVisible();
});

test("shows point-specific bottom tabs on points page", async () => {
  render(<App />);
  await login();

  fireEvent.click(screen.getByRole("link", { name: "포인트" }));

  expect(window.location.pathname).toBe("/points");
  expect(screen.getByRole("region", { name: "최근 커밋 활동" })).toBeVisible();
  expect(screen.getByRole("region", { name: "월별 커밋 예측" })).toBeVisible();
  expect(screen.getByRole("navigation", { name: "포인트" })).toBeVisible();
  expect(screen.getByRole("button", { name: "일일" })).toBeVisible();
  expect(screen.getByRole("button", { name: "월드컵" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "월드컵" }));

  expect(window.location.pathname).toBe("/points/worldcup");
  expect(screen.getByRole("region", { name: "월드컵 포인트" })).toBeVisible();
  expect(screen.getByRole("tab", { name: "06.26. (오늘)", selected: true })).toBeVisible();
  expect(screen.getAllByText("프랑스")[0]).toBeVisible();
  expect(screen.getAllByText("노르웨이")[0]).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "일일" }));

  expect(window.location.pathname).toBe("/points");
  expect(screen.getByRole("region", { name: "최근 커밋 활동" })).toBeVisible();

  fireEvent.click(screen.getByRole("link", { name: "홈으로 돌아가기" }));

  expect(window.location.pathname).toBe("/");
});
