import type { Meta, StoryObj } from "@storybook/react";
import { FilterTags } from ".";

const meta: Meta<typeof FilterTags> = {
  title: "Components/FilterTags",
  component: FilterTags,

  argTypes: {
    type: {
      options: ["more-default", "default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof FilterTags>;

export const Default: Story = {
  args: {
    type: "more-default",
    className: {},
    text: "Bluetooth",
  },
};
