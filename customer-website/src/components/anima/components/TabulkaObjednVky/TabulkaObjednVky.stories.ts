import type { Meta, StoryObj } from "@storybook/react";
import { TabulkaObjednVky } from ".";

const meta: Meta<typeof TabulkaObjednVky> = {
  title: "Components/TabulkaObjednVky",
  component: TabulkaObjednVky,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TabulkaObjednVky>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
