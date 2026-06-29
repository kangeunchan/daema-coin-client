import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../badge";
import { Button } from "../button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";

const meta = {
  title: "UI/Card",
  component: Card,
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
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <Card {...args} style={{ maxWidth: 420 }}>
      <CardHeader>
        <CardTitle>Settlement summary</CardTitle>
        <CardDescription>Today&apos;s point movement and pending operations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="daema-story-row">
          <Badge intent="success">Synced</Badge>
          <Badge>12 records</Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm">Review</Button>
        <Button intent="ghost" size="sm">
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="daema-story-grid">
      {(["default", "muted", "glass"] as const).map((tone) => (
        <Card key={tone} tone={tone}>
          <CardHeader>
            <CardTitle>{tone}</CardTitle>
            <CardDescription>Card tone used for production surfaces.</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge intent={tone === "default" ? "brand" : "neutral"}>{tone}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
