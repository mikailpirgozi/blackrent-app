import type { Meta, StoryObj } from "@storybook/react";
import { FaqRychlyKontaktFooter1728 } from ".";

const meta: Meta<typeof FaqRychlyKontaktFooter1728> = {
  title: "Components/FaqRychlyKontaktFooter1728",
  component: FaqRychlyKontaktFooter1728,

  argTypes: {
    type: {
      options: ["a"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FaqRychlyKontaktFooter1728>;

export const Default: Story = {
  args: {
    type: "a",
    className: {},
  },
};
