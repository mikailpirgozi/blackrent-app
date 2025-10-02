import type { Meta, StoryObj } from "@storybook/react";
import { PropertyWrapper } from ".";

const meta: Meta<typeof PropertyWrapper> = {
  title: "Components/PropertyWrapper",
  component: PropertyWrapper,

  argTypes: {
    property1: {
      options: ["variant-4"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PropertyWrapper>;

export const Default: Story = {
  args: {
    property1: "variant-4",
    className: {},
  },
};
