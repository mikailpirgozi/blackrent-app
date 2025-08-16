import type { Meta, StoryObj } from "@storybook/react";
import { FilterMobileButton } from ".";

const meta: Meta<typeof FilterMobileButton> = {
  title: "Components/FilterMobileButton",
  component: FilterMobileButton,

  argTypes: {
    state: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FilterMobileButton>;

export const Default: Story = {
  args: {
    state: "default",
    className: {},
  },
};
