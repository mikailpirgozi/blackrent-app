import type { Meta, StoryObj } from "@storybook/react";
import { KartaVozidlaHomepage744 } from ".";

const meta: Meta<typeof KartaVozidlaHomepage744> = {
  title: "Components/KartaVozidlaHomepage744",
  component: KartaVozidlaHomepage744,

  argTypes: {
    type: {
      options: ["tag-DPH", "hover", "tag-discount-DPH", "default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof KartaVozidlaHomepage744>;

export const Default: Story = {
  args: {
    type: "tag-DPH",
    nHAdVozidlaClassName: {},
  },
};
