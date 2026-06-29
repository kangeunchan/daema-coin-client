import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: {
    children: "Badge",
    intent: "neutral",
    size: "md",
  },
  argTypes: {
    intent: {
      control: "select",
      options: ["neutral", "brand", "success", "warning", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="daema-story-stack">
      {(["sm", "md"] as const).map((size) => (
        <div className="daema-story-panel" key={size}>
          <p className="daema-story-label">size {size}</p>
          <div className="daema-story-row">
            <Badge size={size}>Neutral</Badge>
            <Badge intent="brand" size={size}>
              Brand
            </Badge>
            <Badge intent="success" size={size}>
              Success
            </Badge>
            <Badge intent="warning" size={size}>
              Warning
            </Badge>
            <Badge intent="danger" size={size}>
              Danger
            </Badge>
          </div>
        </div>
      ))}
    </div>
  ),
};
