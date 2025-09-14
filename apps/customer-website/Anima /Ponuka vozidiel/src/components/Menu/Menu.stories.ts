import type { Meta, StoryObj } from "@storybook/react";
import { Menu } from ".";

const meta: Meta<typeof Menu> = {
  title: "Components/Menu",
  component: Menu,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
