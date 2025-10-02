import type { Meta, StoryObj } from "@storybook/react";
import { KartaVozidla } from ".";

const meta: Meta<typeof KartaVozidla> = {
  title: "Components/KartaVozidla",
  component: KartaVozidla,

  argTypes: {
    type: {
      options: ["tag-DPH", "hover", "tag-discount-DPH", "default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof KartaVozidla>;

export const Default: Story = {
  args: {
    type: "tag-DPH",
    nHAdVozidlaClassName: {},
    className: {},
    frameClassName: {},
  },
};
