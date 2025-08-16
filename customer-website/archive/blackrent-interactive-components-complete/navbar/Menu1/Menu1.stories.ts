import type { Meta, StoryObj } from "@storybook/react";
import { Menu1 } from ".";

const meta: Meta<typeof Menu1> = {
  title: "Components/Menu1",
  component: Menu1,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menu1>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
