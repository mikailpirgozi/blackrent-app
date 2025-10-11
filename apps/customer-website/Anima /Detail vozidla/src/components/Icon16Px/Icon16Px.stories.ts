import type { Meta, StoryObj } from "@storybook/react";
import { Icon16Px } from ".";

const meta: Meta<typeof Icon16Px> = {
  title: "Components/Icon16Px",
  component: Icon16Px,

  argTypes: {
    typ: {
      options: [
        "arrow-down",
        "info",
        "nahon",
        "heart",
        "inxo-1px",
        "plus",
        "arrow-right",
        "prevodovka",
        "vykon",
        "check",
        "share",
        "palivo",
      ],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Icon16Px>;

export const Default: Story = {
  args: {
    typ: "arrow-down",
  },
};
