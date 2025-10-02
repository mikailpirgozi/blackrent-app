import type { Meta, StoryObj } from "@storybook/react";
import { Faq } from ".";

const meta: Meta<typeof Faq> = {
  title: "Components/Faq",
  component: Faq,
};

export default meta;

type Story = StoryObj<typeof Faq>;

export const Default: Story = {
  args: {
    className: {},
  },
};
