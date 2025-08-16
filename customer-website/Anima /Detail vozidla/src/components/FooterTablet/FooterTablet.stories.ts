import type { Meta, StoryObj } from "@storybook/react";
import { FooterTablet } from ".";

const meta: Meta<typeof FooterTablet> = {
  title: "Components/FooterTablet",
  component: FooterTablet,

  argTypes: {
    type: {
      options: ["a"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FooterTablet>;

export const Default: Story = {
  args: {
    type: "a",
    className: {},
  },
};
