import type { Meta, StoryObj } from "@storybook/react";
import { Faq744 } from ".";

const meta: Meta<typeof Faq744> = {
  title: "Components/Faq744",
  component: Faq744,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Faq744>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
