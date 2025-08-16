import type { Meta, StoryObj } from "@storybook/react";
import { FaqRychlyKontakt } from ".";

const meta: Meta<typeof FaqRychlyKontakt> = {
  title: "Components/FaqRychlyKontakt",
  component: FaqRychlyKontakt,

  argTypes: {
    type: {
      options: ["a"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FaqRychlyKontakt>;

export const Default: Story = {
  args: {
    type: "a",
    className: {},
  },
};
