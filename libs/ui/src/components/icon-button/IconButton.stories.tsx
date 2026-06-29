import type { Meta, StoryObj } from "@storybook/react-vite";

import { IconButton } from "./IconButton";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  args: {
    "aria-label": "Add item",
    children: "+",
    intent: "ghost",
    size: "md",
  },
  argTypes: {
    intent: {
      control: "select",
      options: ["ghost", "primary", "secondary", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="daema-story-stack">
      {(["ghost", "primary", "secondary", "danger"] as const).map((intent) => (
        <div className="daema-story-panel" key={intent}>
          <p className="daema-story-label">{intent}</p>
          <div className="daema-story-row">
            <IconButton aria-label={`${intent} small action`} intent={intent} size="sm">
              +
            </IconButton>
            <IconButton aria-label={`${intent} medium action`} intent={intent}>
              +
            </IconButton>
            <IconButton aria-label={`${intent} large action`} intent={intent} size="lg">
              +
            </IconButton>
            <IconButton aria-label={`${intent} disabled action`} disabled intent={intent}>
              +
            </IconButton>
          </div>
        </div>
      ))}
    </div>
  ),
};
