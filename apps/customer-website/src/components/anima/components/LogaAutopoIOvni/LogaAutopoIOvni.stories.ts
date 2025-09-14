import type { Meta, StoryObj } from "@storybook/react";
import { LogaAutopoIOvni } from ".";

const meta: Meta<typeof LogaAutopoIOvni> = {
  title: "Components/LogaAutopoIOvni",
  component: LogaAutopoIOvni,

  argTypes: {
    type: {
      options: ["blackrent-logo-20"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LogaAutopoIOvni>;

export const Default: Story = {
  args: {
    type: "blackrent-logo-20",
    className: {},
  },
};
