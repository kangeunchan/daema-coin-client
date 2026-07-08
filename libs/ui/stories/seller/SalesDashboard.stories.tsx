import type { Meta, StoryObj } from "@storybook/react-vite";

import { SellerSalesDashboard } from "../../../../apps/seller/src/SalesDashboard";
import "../../../../apps/seller/src/styles.css";

const meta = {
  title: "Seller/Sales Dashboard",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <SellerSalesDashboard
      booth={{
        id: "booth-cafe-01",
        locationLabel: "운동장 A-12",
        name: "청량 카페",
        status: "active",
      }}
      booths={[{ id: "booth-cafe-01", name: "청량 카페" }]}
      dashboard={{
        orderCount: 148,
        paymentCount: 134,
        productCount: 12,
        revenue: { currency: "DMC", formatted: "1,284,000 DMC", value: 1_284_000 },
        visitCount: 782,
      }}
      previewMode
      report={{
        paymentCount: 134,
        totalAmount: { currency: "DMC", formatted: "1,284,000 DMC", value: 1_284_000 },
      }}
      session={{ displayName: "청량 카페 매니저", loginId: "cafe.manager" }}
    />
  ),
};
