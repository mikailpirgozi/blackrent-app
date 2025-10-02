import type { Meta, StoryObj } from "@storybook/react";
import { CheckBoxy } from ".";

const meta: Meta<typeof CheckBoxy> = {
  title: "Components/CheckBoxy",
  component: CheckBoxy,

  argTypes: {
    stav: {
      options: ["radio-selected", "radio-default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CheckBoxy>;

export const Default: Story = {
  args: {
    stav: "radio-selected",
  },
};
