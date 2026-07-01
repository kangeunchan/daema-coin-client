import type { Meta, StoryObj } from "@storybook/react-vite";

import { navigationTabs } from "../../../../apps/customer/src/entities/customer-home";
import { DailyCommitContent } from "../../../../apps/customer/src/pages/points/CustomerPointsPage";
import {
  commitActivity,
  commitHistoryTransactions,
  commitRewardSummary,
} from "../../../../apps/customer/src/pages/points/model/commitPoints";
import { AppHeader } from "../../../../apps/customer/src/widgets/app-header";
import { BottomTabbar } from "../../../../apps/customer/src/widgets/bottom-tabbar";

const meta = {
  title: "Customer/Commit Rewards",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <div className="daema-customer-story">
      <div className="daema-customer-story__frame daema-customer-story__frame--points">
        <AppHeader />
        <main
          className="customer-points-page customer-points-page--commit"
          aria-label="커밋 리워드"
        >
          <DailyCommitContent
            activity={commitActivity}
            rewardSummary={commitRewardSummary}
            transactions={commitHistoryTransactions}
          />
        </main>
        <div className="daema-customer-story__bottom daema-customer-story__bottom--points">
          <BottomTabbar
            activePointTab="daily"
            activeTabId="points"
            onPointTabChange={() => undefined}
            onTabChange={() => undefined}
            tabs={navigationTabs}
          />
        </div>
      </div>
    </div>
  ),
};
