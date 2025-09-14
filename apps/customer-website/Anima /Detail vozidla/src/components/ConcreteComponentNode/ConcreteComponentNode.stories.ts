import type { Meta, StoryObj } from "@storybook/react";
import { ConcreteComponentNode } from ".";

const meta: Meta<typeof ConcreteComponentNode> = {
  title: "Components/ConcreteComponentNode",
  component: ConcreteComponentNode,

  argTypes: {
    property1: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ConcreteComponentNode>;

export const Default: Story = {
  args: {
    property1: "default",
  },
};
