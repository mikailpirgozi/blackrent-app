import type { Meta, StoryObj } from "@storybook/react";
import { BackToTopButton } from ".";

const meta: Meta<typeof BackToTopButton> = {
  title: "Components/BackToTopButton",
  component: BackToTopButton,
};

export default meta;

type Story = StoryObj<typeof BackToTopButton>;

export const Default: Story = {
  args: {
    className: {},
  },
};
