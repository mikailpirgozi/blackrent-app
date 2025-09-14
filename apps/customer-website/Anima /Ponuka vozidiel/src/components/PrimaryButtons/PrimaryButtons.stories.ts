import type { Meta, StoryObj } from "@storybook/react";
import { PrimaryButtons } from ".";

const meta: Meta<typeof PrimaryButtons> = {
  title: "Components/PrimaryButtons",
  component: PrimaryButtons,

  argTypes: {
    tlacitkoNaTmavemem40: {
      options: ["tlacitko-na-tmavemem-403"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PrimaryButtons>;

export const Default: Story = {
  args: {
    tlacitkoNaTmavemem40: "tlacitko-na-tmavemem-403",
    className: {},
    text: "Button",
  },
};
