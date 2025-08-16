import type { Meta, StoryObj } from "@storybook/react";
import { UnderFooter2 } from ".";

const meta: Meta<typeof UnderFooter2> = {
  title: "Components/UnderFooter2",
  component: UnderFooter2,

  argTypes: {
    property1: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UnderFooter2>;

export const Default: Story = {
  args: {
    property1: "default",
  },
};
