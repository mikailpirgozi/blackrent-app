import type { Meta, StoryObj } from "@storybook/react";
import { NavigationButtons } from ".";

const meta: Meta<typeof NavigationButtons> = {
  title: "Components/NavigationButtons",
  component: NavigationButtons,

  argTypes: {
    type: {
      options: ["arrow-right-button-default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof NavigationButtons>;

export const Default: Story = {
  args: {
    type: "arrow-right-button-default",
  },
};
