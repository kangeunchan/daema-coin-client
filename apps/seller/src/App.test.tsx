import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { App } from "./App";
import { SellerSalesDashboard } from "./SalesDashboard";

test("renders the booth account login", async () => {
  render(<App />);

  expect(await screen.findByLabelText("부스 로그인")).toBeVisible();
  expect(screen.getByText("부스 계정 로그인")).toBeVisible();
});

test("renders the sales dashboard workspace", () => {
  render(
    <SellerSalesDashboard
      booth={{ id: "booth-1", name: "청량 카페" }}
      booths={[{ id: "booth-1", name: "청량 카페" }]}
      dashboard={{
        orderCount: 3,
        paymentCount: 2,
        revenue: { formatted: "1,284,000 DMC", value: 1_284_000 },
        visitCount: 782,
      }}
      orders={[
        {
          createdAt: new Date(Date.now() - 12 * 60_000).toISOString(),
          customerName: "윤하린",
          id: "ORD-1918",
          item: "딸기 소다 외 1건",
          items: [
            { name: "딸기 소다", options: ["휘핑 추가"], quantity: 1 },
            { name: "아이스 초코", quantity: 1 },
          ],
          status: "pending",
        },
        {
          createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
          customerName: "김서준",
          id: "ORD-1921",
          item: "수제 레몬 에이드 2개",
          items: [{ name: "수제 레몬 에이드", options: ["얼음 적게"], quantity: 2 }],
          status: "pending",
        },
        {
          createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
          customerName: "한지우",
          id: "ORD-1924",
          item: "시그니처 세트 외 2건",
          items: [
            { name: "시그니처 세트", options: ["매운맛", "치즈 추가"], quantity: 1 },
            { name: "딸기 소다", quantity: 2 },
          ],
          status: "pending",
        },
      ]}
      products={[
        { id: "PRD-01", price: 18_000, sold: 42, stock: 4, status: "판매 중", title: "시그니처 세트" },
        { id: "PRD-02", price: 7_000, sold: 38, stock: 8, status: "판매 중", title: "수제 레몬 에이드" },
        { id: "PRD-03", price: 7_000, sold: 31, stock: 13, status: "판매 중", title: "딸기 소다" },
        { id: "PRD-04", price: 6_000, sold: 23, stock: 21, status: "판매 중", title: "아이스 초코" },
      ]}
      report={{
        paymentCount: 2,
        payments: [
          {
            amount: { formatted: "32,000 DMC", value: 32_000 },
            createdAt: "2026-07-01T12:42:00+09:00",
            customerName: "김민준",
            id: "PAY-1842",
            productName: "수제 레몬 에이드 외 1건",
            status: "captured",
          },
          {
            amount: { formatted: "12,000 DMC", value: 12_000 },
            createdAt: "2026-07-01T11:56:00+09:00",
            customerName: "최유진",
            id: "PAY-1756",
            productName: "딸기 소다",
            status: "refunded",
          },
        ],
        totalAmount: { formatted: "1,284,000 DMC", value: 1_284_000 },
      }}
      session={{ displayName: "카페 매니저", loginId: "cafe.manager" }}
    />,
  );

  expect(screen.getByRole("heading", { name: "주문을 빠르게 완료하세요" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: /픽업 완료/ })).toHaveLength(3);

  fireEvent.keyDown(window, { key: "1" });
  expect(screen.getByRole("region", { name: "오늘 매출" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "완료 처리할 주문" })).toBeVisible();
  expect(screen.getAllByRole("button", { name: "픽업 완료" })).toHaveLength(3);

  fireEvent.click(screen.getAllByRole("button", { name: "픽업 완료" })[0]!);

  expect(screen.getAllByRole("button", { name: "픽업 완료" })).toHaveLength(2);
  expect(screen.getByRole("status")).toHaveTextContent("ORD-1918 픽업을 완료했어요");

  fireEvent.click(screen.getByRole("button", { name: "실행 취소" }));

  expect(screen.getAllByRole("button", { name: "픽업 완료" })).toHaveLength(3);
  expect(screen.getByRole("heading", { name: "최근 결제" })).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "환불 내역" }));
  expect(screen.getByText("12,000 DMC")).toBeVisible();

  const orderSearch = screen.getByRole("textbox", { name: "주문 검색" });
  fireEvent.change(orderSearch, { target: { value: "없는 주문" } });
  expect(screen.getByText("검색 결과가 없어요")).toBeVisible();
  fireEvent.change(orderSearch, { target: { value: "" } });

  fireEvent.click(screen.getByRole("button", { name: "주문 처리" }));
  expect(screen.getByRole("heading", { name: "주문을 빠르게 완료하세요" })).toBeVisible();
  expect(screen.getByRole("button", { name: "오래된 주문순" })).toBeVisible();

  fireEvent.click(screen.getAllByRole("button", { name: /픽업 완료/ })[0]!);
  fireEvent.click(screen.getByRole("button", { name: "완료 1" }));
  expect(screen.getByRole("button", { name: /처리 완료/ })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "상품과 재고" }));
  expect(screen.getByRole("heading", { name: "판매 상품을 관리하세요" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "시그니처 세트 재고 늘리기" }));
  expect(screen.getByText("5")).toBeVisible();

  fireEvent.click(screen.getByRole("button", { name: "상품 추가" }));
  expect(screen.getByRole("heading", { name: "새 상품 등록" })).toBeVisible();
  fireEvent.change(screen.getByRole("textbox", { name: "상품명" }), {
    target: { value: "청포도 에이드" },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "판매 가격" }), {
    target: { value: "8000" },
  });
  fireEvent.change(screen.getByRole("spinbutton", { name: "초기 재고" }), {
    target: { value: "20" },
  });

  fireEvent.click(screen.getByRole("button", { name: "정산" }));
  expect(screen.getByRole("heading", { name: "오늘 판매 대금을 확인하세요" })).toBeVisible();
});
