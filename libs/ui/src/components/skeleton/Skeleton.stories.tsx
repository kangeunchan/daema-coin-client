import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./Skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: {
    shape: "block",
  },
  argTypes: {
    shape: {
      control: "inline-radio",
      options: ["block", "circle", "text"],
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => <Skeleton {...args} style={{ height: 48, width: 240 }} />,
};

export const ContentLoading: Story = {
  render: () => (
    <div className="daema-story-panel" style={{ maxWidth: 360 }}>
      <div className="daema-story-row">
        <Skeleton shape="circle" style={{ height: 48, width: 48 }} />
        <div className="daema-story-panel" style={{ flex: 1 }}>
          <Skeleton shape="text" style={{ width: "70%" }} />
          <Skeleton shape="text" style={{ width: "45%" }} />
        </div>
      </div>
      <Skeleton shape="block" style={{ height: 120 }} />
    </div>
  ),
};
