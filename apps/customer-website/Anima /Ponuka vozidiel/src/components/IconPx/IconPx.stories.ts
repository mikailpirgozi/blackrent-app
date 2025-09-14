import type { Meta, StoryObj } from "@storybook/react";
import { IconPx } from ".";

const meta: Meta<typeof IconPx> = {
  title: "Components/IconPx",
  component: IconPx,

  argTypes: {
    typ: {
      options: [
        "arrow-right_1",
        "arrow-top",
        "arrow-down",
        "cancel",
        "arrow-right",
      ],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof IconPx>;

export const Default: Story = {
  args: {
    typ: "arrow-right_1",
    typArrowDownClassName: {},
    typArrowDown: "/img/typ-arrow-down.pdf",
  },
};
