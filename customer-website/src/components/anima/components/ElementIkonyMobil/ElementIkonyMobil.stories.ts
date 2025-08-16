import type { Meta, StoryObj } from "@storybook/react";
import { ElementIkonyMobil } from ".";

const meta: Meta<typeof ElementIkonyMobil> = {
  title: "Components/ElementIkonyMobil",
  component: ElementIkonyMobil,
};

export default meta;

type Story = StoryObj<typeof ElementIkonyMobil>;

export const Default: Story = {
  args: {
    className: {},
    overlapGroupClassName: {},
    ellipse: "/img/ellipse-1.svg",
    union: "/img/union.svg",
  },
};
