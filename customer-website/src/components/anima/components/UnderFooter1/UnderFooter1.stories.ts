import type { Meta, StoryObj } from "@storybook/react";
import { UnderFooter1 } from ".";

const meta: Meta<typeof UnderFooter1> = {
  title: "Components/UnderFooter1",
  component: UnderFooter1,

  argTypes: {
    property1: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UnderFooter1>;

export const Default: Story = {
  args: {
    property1: "default",
  },
};
