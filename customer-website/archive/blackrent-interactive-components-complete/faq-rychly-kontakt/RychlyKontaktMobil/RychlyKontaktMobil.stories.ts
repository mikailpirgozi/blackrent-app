import type { Meta, StoryObj } from "@storybook/react";
import { RychlyKontaktMobil } from ".";

const meta: Meta<typeof RychlyKontaktMobil> = {
  title: "Components/RychlyKontaktMobil",
  component: RychlyKontaktMobil,

  argTypes: {
    property1: {
      options: ["variant-3"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RychlyKontaktMobil>;

export const Default: Story = {
  args: {
    property1: "variant-3",
    className: {},
    fotkaOperToraClassName: {},
    vector: "/img/vector-3.svg",
    line: "/img/line-21-1.svg",
  },
};
