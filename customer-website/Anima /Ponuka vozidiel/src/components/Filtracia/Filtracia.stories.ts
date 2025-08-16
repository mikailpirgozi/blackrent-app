import type { Meta, StoryObj } from "@storybook/react";
import { Filtracia } from ".";

const meta: Meta<typeof Filtracia> = {
  title: "Components/Filtracia",
  component: Filtracia,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Filtracia>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
  },
};
