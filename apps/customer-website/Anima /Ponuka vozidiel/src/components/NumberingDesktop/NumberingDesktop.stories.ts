import type { Meta, StoryObj } from "@storybook/react";
import { NumberingDesktop } from ".";

const meta: Meta<typeof NumberingDesktop> = {
  title: "Components/NumberingDesktop",
  component: NumberingDesktop,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NumberingDesktop>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
