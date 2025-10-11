import type { Meta, StoryObj } from "@storybook/react";
import { FooterWrapper } from ".";

const meta: Meta<typeof FooterWrapper> = {
  title: "Components/FooterWrapper",
  component: FooterWrapper,
};

export default meta;

type Story = StoryObj<typeof FooterWrapper>;

export const Default: Story = {
  args: {
    className: {},
  },
};
