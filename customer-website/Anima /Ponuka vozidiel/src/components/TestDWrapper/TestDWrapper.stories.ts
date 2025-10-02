import type { Meta, StoryObj } from "@storybook/react";
import { TestDWrapper } from ".";

const meta: Meta<typeof TestDWrapper> = {
  title: "Components/TestDWrapper",
  component: TestDWrapper,

  argTypes: {
    test: {
      options: ["d"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TestDWrapper>;

export const Default: Story = {
  args: {
    test: "d",
    className: {},
  },
};
