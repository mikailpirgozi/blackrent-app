import type { Meta, StoryObj } from "@storybook/react";
import { NumberingMobile } from ".";

const meta: Meta<typeof NumberingMobile> = {
  title: "Components/NumberingMobile",
  component: NumberingMobile,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NumberingMobile>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
