import type { Meta, StoryObj } from "@storybook/react";
import { RychlyKontakt } from ".";

const meta: Meta<typeof RychlyKontakt> = {
  title: "Components/RychlyKontakt",
  component: RychlyKontakt,

  argTypes: {
    type: {
      options: ["c"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RychlyKontakt>;

export const Default: Story = {
  args: {
    type: "c",
    className: {},
  },
};
