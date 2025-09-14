import type { Meta, StoryObj } from "@storybook/react";
import { TlacitkoNaTmavemWrapper } from ".";

const meta: Meta<typeof TlacitkoNaTmavemWrapper> = {
  title: "Components/TlacitkoNaTmavemWrapper",
  component: TlacitkoNaTmavemWrapper,

  argTypes: {
    tlacitkoNaTmavem: {
      options: ["normal"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TlacitkoNaTmavemWrapper>;

export const Default: Story = {
  args: {
    tlacitkoNaTmavem: "normal",
    className: {},
    text: "Button",
  },
};
