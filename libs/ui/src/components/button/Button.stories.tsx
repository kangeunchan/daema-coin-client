import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    children: "Button",
    intent: "primary",
    size: "md",
    width: "auto",
  },
  argTypes: {
    intent: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "inline-radio",
      options: ["sm", "md", "lg"],
    },
    width: {
      control: "inline-radio",
      options: ["auto", "full"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

const LeadingIcon = () => (
  <span aria-hidden="true" className="daema-story-icon">
    +
  </span>
);

const TrailingIcon = () => (
  <span aria-hidden="true" className="daema-story-icon">
    &gt;
  </span>
);

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="daema-story-stack">
      {(["primary", "secondary", "ghost", "danger"] as const).map((intent) => (
        <div className="daema-story-panel" key={intent}>
          <p className="daema-story-label">{intent}</p>
          <div className="daema-story-row">
            <Button intent={intent} size="sm">
              Small
            </Button>
            <Button intent={intent}>Medium</Button>
            <Button intent={intent} size="lg">
              Large
            </Button>
            <Button intent={intent} leadingIcon={<LeadingIcon />} trailingIcon={<TrailingIcon />}>
              With icons
            </Button>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="daema-story-stack">
      <div className="daema-story-row">
        <Button>Default</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Saving</Button>
        <Button intent="danger" loading loadingLabel="Deleting">
          Delete
        </Button>
      </div>
      <div style={{ maxWidth: 360 }}>
        <Button width="full">Full width action</Button>
      </div>
    </div>
  ),
};
