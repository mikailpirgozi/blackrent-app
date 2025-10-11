import type { Meta, StoryObj } from "@storybook/react";
import { ElementIconsDarkMedium } from ".";

const meta: Meta<typeof ElementIconsDarkMedium> = {
  title: "Components/ElementIconsDarkMedium",
  component: ElementIconsDarkMedium,

  argTypes: {
    type: {
      options: ["check"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ElementIconsDarkMedium>;

export const Default: Story = {
  args: {
    type: "check",
    overlapGroupClassName: {},
    ellipse: "/img/ellipse-1-1.svg",
    union: "/img/union-5.svg",
  },
};
