import type { Meta, StoryObj } from "@storybook/react";
import { KartaVozidlaPonuka } from ".";

const meta: Meta<typeof KartaVozidlaPonuka> = {
  title: "Components/KartaVozidlaPonuka",
  component: KartaVozidlaPonuka,

  argTypes: {
    property1: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof KartaVozidlaPonuka>;

export const Default: Story = {
  args: {
    property1: "default",
    className: {},
    nHAdVozidlaClassName: {},
    tlaTkoClassName: {},
  },
};
