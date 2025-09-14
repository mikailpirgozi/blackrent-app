import type { Meta, StoryObj } from "@storybook/react";
import { TypeAWrapper } from ".";

const meta: Meta<typeof TypeAWrapper> = {
  title: "Components/TypeAWrapper",
  component: TypeAWrapper,

  argTypes: {
    type: {
      options: ["a"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TypeAWrapper>;

export const Default: Story = {
  args: {
    type: "a",
    className: {},
  },
};
