import type { Meta, StoryObj } from "@storybook/react";
import { Store } from ".";

const meta: Meta<typeof Store> = {
  title: "Components/Store",
  component: Store,

  argTypes: {
    state: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Store>;

export const Default: Story = {
  args: {
    state: "default",
    className: {},
  },
};
