import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge";
import { Text } from "../text";
import { Surface } from "./Surface";

const meta = {
  title: "UI/Surface",
  component: Surface,
  tags: ["autodocs"],
  args: {
    padding: "md",
    tone: "default",
  },
  argTypes: {
    padding: {
      control: "inline-radio",
      options: ["none", "sm", "md", "lg"],
    },
    tone: {
      control: "inline-radio",
      options: ["default", "muted", "glass"],
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Surface {...args} style={{ maxWidth: 520 }}>
      <Text as="h2" variant="title" weight="semibold">
        Operational surface
      </Text>
      <Text color="muted">Use surfaces for page-level sections and persistent tool areas.</Text>
    </Surface>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="daema-story-grid">
      {(["default", "muted", "glass"] as const).map((tone) => (
        <Surface key={tone} tone={tone}>
          <div className="daema-story-panel">
            <Badge>{tone}</Badge>
            <Text color="muted">Surface tone preview for app backgrounds.</Text>
          </div>
        </Surface>
      ))}
    </div>
  ),
};
