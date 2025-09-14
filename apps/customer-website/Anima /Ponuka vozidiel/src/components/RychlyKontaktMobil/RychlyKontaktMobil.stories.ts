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
  },
};
