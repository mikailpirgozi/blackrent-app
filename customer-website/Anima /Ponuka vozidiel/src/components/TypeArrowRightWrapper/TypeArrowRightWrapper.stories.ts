import type { Meta, StoryObj } from "@storybook/react";
import { TypeArrowRightWrapper } from ".";

const meta: Meta<typeof TypeArrowRightWrapper> = {
  title: "Components/TypeArrowRightWrapper",
  component: TypeArrowRightWrapper,

  argTypes: {
    type: {
      options: ["arrow-right-button-default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TypeArrowRightWrapper>;

export const Default: Story = {
  args: {
    type: "arrow-right-button-default",
  },
};
