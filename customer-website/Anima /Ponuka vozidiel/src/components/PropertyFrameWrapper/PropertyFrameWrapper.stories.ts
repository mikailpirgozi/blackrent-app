import type { Meta, StoryObj } from "@storybook/react";
import { PropertyFrameWrapper } from ".";

const meta: Meta<typeof PropertyFrameWrapper> = {
  title: "Components/PropertyFrameWrapper",
  component: PropertyFrameWrapper,

  argTypes: {
    property1: {
      options: ["frame-375"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PropertyFrameWrapper>;

export const Default: Story = {
  args: {
    property1: "frame-375",
    className: {},
  },
};
