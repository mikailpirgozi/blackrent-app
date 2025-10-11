import type { Meta, StoryObj } from "@storybook/react";
import { StaviTlaTiekShare } from ".";

const meta: Meta<typeof StaviTlaTiekShare> = {
  title: "Components/StaviTlaTiekShare",
  component: StaviTlaTiekShare,

  argTypes: {
    detailVozidlaIkonyHornaLiTa: {
      options: ["hover", "default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof StaviTlaTiekShare>;

export const Default: Story = {
  args: {
    detailVozidlaIkonyHornaLiTa: "hover",
    union: "/img/union-2.svg",
  },
};
