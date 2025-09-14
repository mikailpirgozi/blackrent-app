import type { Meta, StoryObj } from "@storybook/react";
import { KartaVozidlaPonukaVozidiel1728 } from ".";

const meta: Meta<typeof KartaVozidlaPonukaVozidiel1728> = {
  title: "Components/KartaVozidlaPonukaVozidiel1728",
  component: KartaVozidlaPonukaVozidiel1728,

  argTypes: {
    type: {
      options: ["tag-DPH", "hover", "tag-discount-DPH", "default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof KartaVozidlaPonukaVozidiel1728>;

export const Default: Story = {
  args: {
    type: "tag-DPH",
    className: {},
    nHAdVozidlaClassName: {},
  },
};
