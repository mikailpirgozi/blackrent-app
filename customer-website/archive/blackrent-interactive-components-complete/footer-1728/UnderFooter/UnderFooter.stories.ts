import type { Meta, StoryObj } from "@storybook/react";
import { UnderFooter } from ".";

const meta: Meta<typeof UnderFooter> = {
  title: "Components/UnderFooter",
  component: UnderFooter,

  argTypes: {
    property1: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof UnderFooter>;

export const Default: Story = {
  args: {
    property1: "default",
  },
};
