import type { Meta, StoryObj } from "@storybook/react-vite";

import { Divider } from "./Divider";

const meta = {
  title: "UI/Divider",
  component: Divider,
  tags: ["autodocs"],
  args: {
    orientation: "horizontal",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Divider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <div
      className="daema-story-row"
      style={args.orientation === "vertical" ? { height: 80 } : undefined}
    >
      <span>Before</span>
      <Divider {...args} />
      <span>After</span>
    </div>
  ),
};
