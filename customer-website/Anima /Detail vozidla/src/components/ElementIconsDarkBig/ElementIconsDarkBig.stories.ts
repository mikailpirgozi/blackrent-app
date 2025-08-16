import type { Meta, StoryObj } from "@storybook/react";
import { ElementIconsDarkBig } from ".";

const meta: Meta<typeof ElementIconsDarkBig> = {
  title: "Components/ElementIconsDarkBig",
  component: ElementIconsDarkBig,

  argTypes: {
    type: {
      options: ["check"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ElementIconsDarkBig>;

export const Default: Story = {
  args: {
    type: "check",
    overlapGroupClassName: {},
    ellipse: "/img/ellipse-1-2.svg",
    union: "/img/union-7.svg",
  },
};
