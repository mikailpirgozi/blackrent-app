import type { Meta, StoryObj } from "@storybook/react";
import { BlackrentLogo } from ".";

const meta: Meta<typeof BlackrentLogo> = {
  title: "Components/BlackrentLogo",
  component: BlackrentLogo,
};

export default meta;

type Story = StoryObj<typeof BlackrentLogo>;

export const Default: Story = {
  args: {
    className: {},
  },
};
