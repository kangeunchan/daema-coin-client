import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "./Text";

const meta = {
  title: "UI/Text",
  component: Text,
  tags: ["autodocs"],
  args: {
    children: "A predictable text primitive for application interfaces.",
    color: "default",
    variant: "body",
    weight: "regular",
  },
  argTypes: {
    align: {
      control: "inline-radio",
      options: ["start", "center", "end"],
    },
    color: {
      control: "select",
      options: ["default", "muted", "subtle", "brand", "danger"],
    },
    variant: {
      control: "select",
      options: ["display", "title", "lead", "body", "caption"],
    },
    weight: {
      control: "select",
      options: ["regular", "medium", "semibold", "bold"],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Scale: Story = {
  render: () => (
    <div className="daema-story-stack">
      <Text as="h1" variant="display" weight="bold">
        Display text
      </Text>
      <Text as="h2" variant="title" weight="semibold">
        Title text for dense product screens
      </Text>
      <Text variant="lead" color="muted">
        Lead text introduces a section without dominating the page.
      </Text>
      <Text>
        Body text is the default reading style. It should remain comfortable in cards, forms, and
        list items.
      </Text>
      <Text as="small" variant="caption" color="subtle">
        Caption text supports metadata and secondary labels.
      </Text>
    </div>
  ),
};
