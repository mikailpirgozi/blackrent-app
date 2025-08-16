import type { Meta, StoryObj } from "@storybook/react";
import { Frame263 } from ".";

const meta: Meta<typeof Frame263> = {
  title: "Components/Frame263",
  component: Frame263,
};

export default meta;

type Story = StoryObj<typeof Frame263>;

export const Default: Story = {
  args: {
    className: {},
    icon16Px4Color: "#F0F0F5",
    popisClassName: {},
    icon16Px5Color: "#F0F0F5",
    popisClassNameOverride: {},
    icon16Px100Color: "#F0F0F5",
    divClassName: {},
    icon16Px101Color: "#F0F0F5",
    divClassNameOverride: {},
  },
};
