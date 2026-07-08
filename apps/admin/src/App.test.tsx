import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { App } from "./App";

vi.mock("./api", () => {
  class AdminApiError extends Error {
    readonly code: string | undefined;
    readonly status: number;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.code = code;
      this.name = "AdminApiError";
      this.status = status;
    }
  }

  return {
    AdminApiError,
    clearAdminAccessToken: vi.fn(),
    createAdminBooth: vi.fn(async (input) => ({
      boothId: input.boothId,
      locationLabel: input.locationLabel,
      name: input.name,
      status: input.status ?? "ready",
    })),
    createInternalAccount: vi.fn(async (input) => ({
      boothId: input.boothId,
      displayName: input.displayName,
      forcePasswordChange: true,
      id: `account-${input.loginId}`,
      loginId: input.loginId,
      role: input.role,
      status: "active",
    })),
    createRoleAssignment: vi.fn(async (input) => ({
      assignmentId: "assignment-1",
      ...input,
    })),
    fetchAdminBooths: vi.fn(async () => [
      {
        boothId: "booth-cafe-01",
        locationLabel: "운동장 A-03",
        name: "청량 카페",
        status: "ready",
      },
    ]),
    fetchAdminDashboard: vi.fn(async () => ({
      boothCount: 1,
      festivalCount: 1,
      orderCount: 0,
      userCount: 0,
    })),
    fetchAdminMe: vi.fn(async () => {
      throw new AdminApiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
    }),
    fetchAdminRoles: vi.fn(async () => [
      {
        description: "관리자 콘솔 접근",
        id: "admin",
        name: "관리자",
        status: "system",
      },
      {
        description: "부스 운영 접근",
        id: "booth",
        name: "부스 운영자",
        status: "system",
      },
      {
        description: "티처 로그인 접근",
        id: "teacher",
        name: "티처",
        status: "system",
      },
    ]),
    fetchInternalAccounts: vi.fn(async () => [
      {
        displayName: "Bootstrap Admin",
        forcePasswordChange: true,
        id: "account-admin",
        loginId: "admin",
        role: "admin",
        status: "active",
      },
    ]),
    isAdminApiEnabled: vi.fn(() => true),
    loginAdmin: vi.fn(async () => ({
      accessToken: "test-token",
      role: "admin",
      user: { login: "admin" },
    })),
    logoutAdmin: vi.fn(async () => ({ loggedOut: true })),
    resetInternalAccountPassword: vi.fn(),
    updateAdminBooth: vi.fn(async (_boothId, input) => ({
      boothId: "booth-cafe-01",
      locationLabel: "운동장 A-03",
      name: "청량 카페",
      status: input.status ?? "ready",
    })),
    updateInternalAccount: vi.fn(async (_accountId, input) => ({
      displayName: "Bootstrap Admin",
      forcePasswordChange: input.forcePasswordChange ?? true,
      id: "account-admin",
      loginId: "admin",
      role: "admin",
      status: input.status ?? "active",
    })),
  };
});

afterEach(() => {
  cleanup();
});

test("renders the internal admin login", async () => {
  render(<App />);

  expect(await screen.findByLabelText("관리자 로그인")).toBeVisible();
  expect(screen.getByText("관리자 로그인")).toBeVisible();
});

test("keeps the account creation form interactive after login", async () => {
  render(<App />);

  fireEvent.change(await screen.findByLabelText("계정 ID"), {
    target: { value: "admin" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호"), {
    target: { value: "admin-password-1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));

  expect(await screen.findByRole("heading", { name: "내부 계정 관리" })).toBeVisible();

  const boothPlaceholders = screen.getAllByPlaceholderText("booth-cafe-01");

  fireEvent.change(boothPlaceholders[0]!, {
    target: { value: "booth-cafe-02" },
  });
  fireEvent.change(screen.getByPlaceholderText("청량 카페"), {
    target: { value: "디저트 부스" },
  });
  fireEvent.change(boothPlaceholders[1]!, {
    target: { value: "booth-dessert-02" },
  });
  fireEvent.change(screen.getByPlaceholderText("10자 이상"), {
    target: { value: "booth-password-1234" },
  });

  expect(screen.getByDisplayValue("booth-cafe-02")).toBeVisible();
  expect(screen.getByDisplayValue("디저트 부스")).toBeVisible();
  expect(screen.getByDisplayValue("booth-dessert-02")).toBeVisible();
});

test("creates teacher accounts from the admin console", async () => {
  const api = await import("./api");

  render(<App />);

  fireEvent.change(await screen.findByLabelText("계정 ID"), {
    target: { value: "admin" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호"), {
    target: { value: "admin-password-1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));

  expect(await screen.findByRole("heading", { name: "내부 계정 관리" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "티처" }));
  fireEvent.change(screen.getByPlaceholderText("teacher-math-01"), {
    target: { value: "teacher-demo" },
  });
  fireEvent.change(screen.getByPlaceholderText("수학 담당 티처"), {
    target: { value: "데모 티처" },
  });
  fireEvent.change(screen.getByPlaceholderText("10자 이상"), {
    target: { value: "teacher-password-1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: "티처 계정 발급" }));

  await waitFor(() =>
    expect(api.createInternalAccount).toHaveBeenCalledWith({
      displayName: "데모 티처",
      forcePasswordChange: true,
      loginId: "teacher-demo",
      password: "teacher-password-1234",
      role: "teacher",
    }),
  );
});

test("switches between admin console tabs", async () => {
  render(<App />);

  fireEvent.change(await screen.findByLabelText("계정 ID"), {
    target: { value: "admin" },
  });
  fireEvent.change(screen.getByLabelText("비밀번호"), {
    target: { value: "admin-password-1234" },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));

  expect(await screen.findByRole("heading", { name: "내부 계정 관리" })).toBeVisible();

  const navigation = screen.getByRole("navigation", { name: "관리자 메뉴" });

  fireEvent.click(within(navigation).getByRole("button", { name: "부스" }));
  expect(screen.getByRole("heading", { name: "부스 운영 관리" })).toBeVisible();
  expect(screen.getByLabelText("부스 생성")).toBeVisible();

  fireEvent.click(within(navigation).getByRole("button", { name: "권한" }));
  expect(screen.getByRole("heading", { name: "권한 범위 관리" })).toBeVisible();
  expect(screen.getByLabelText("권한 할당")).toBeVisible();

  fireEvent.click(within(navigation).getByRole("button", { name: "보안" }));
  expect(screen.getByRole("heading", { name: "보안 작업 센터" })).toBeVisible();
  expect(screen.getByLabelText("비밀번호 작업")).toBeVisible();
});
