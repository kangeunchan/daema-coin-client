import type { Meta, StoryObj } from "@storybook/react-vite";

import { WorldcupMatchDetailContent } from "../../../../apps/customer/src/pages/points/CustomerPointsPage";
import { getWorldcupMatchDetail } from "../../../../apps/customer/src/pages/points/model/worldcupPoints";
import { AppHeader } from "../../../../apps/customer/src/widgets/app-header";
import {
  PointBackButton,
  PointMatchLabel,
} from "../../../../apps/customer/src/widgets/bottom-tabbar";

const meta = {
  title: "Customer/Worldcup Prediction",
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function WorldcupPredictionDetail() {
  const detail = getWorldcupMatchDetail("/points/worldcup/627-dz-at");

  if (!detail) {
    return null;
  }

  return (
    <div className="daema-customer-story">
      <div className="daema-customer-story__frame daema-customer-story__frame--worldcup">
        <AppHeader />
        <main
          className="customer-points-page customer-points-page--worldcup-detail"
          aria-label="월드컵 승부예측 상세"
        >
          <WorldcupMatchDetailContent detail={detail} />
        </main>
        <div className="daema-customer-story__bottom daema-customer-story__bottom--worldcup">
          <nav aria-label="포인트" className="customer-point-tabbar" data-detail="true">
            <PointBackButton
              backHref="/points/worldcup"
              isWorldcupDetail
              onBackToHome={() => undefined}
            />
            <PointMatchLabel label={`${detail.match.home.name} vs ${detail.match.away.name}`} />
          </nav>
        </div>
      </div>
    </div>
  );
}

export const Detail: Story = {
  render: () => <WorldcupPredictionDetail />,
};
