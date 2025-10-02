import type { Meta, StoryObj } from "@storybook/react";
import { TypeDefaultWrapper } from ".";

const meta: Meta<typeof TypeDefaultWrapper> = {
  title: "Components/TypeDefaultWrapper",
  component: TypeDefaultWrapper,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TypeDefaultWrapper>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
