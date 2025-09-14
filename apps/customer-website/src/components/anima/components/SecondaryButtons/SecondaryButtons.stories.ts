import type { Meta, StoryObj } from "@storybook/react";
import { SecondaryButtons } from ".";

const meta: Meta<typeof SecondaryButtons> = {
  title: "Components/SecondaryButtons",
  component: SecondaryButtons,

  argTypes: {
    stateProp: {
      options: ["secondary-hover-pressed", "secondary"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SecondaryButtons>;

export const Default: Story = {
  args: {
    stateProp: "secondary-hover-pressed",
    className: {},
    text: "Button",
  },
};
