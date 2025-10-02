import type { Meta, StoryObj } from "@storybook/react";
import { PropertyXWrapper } from ".";

const meta: Meta<typeof PropertyXWrapper> = {
  title: "Components/PropertyXWrapper",
  component: PropertyXWrapper,

  argTypes: {
    property1: {
      options: ["x"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PropertyXWrapper>;

export const Default: Story = {
  args: {
    property1: "x",
    className: {},
  },
};
