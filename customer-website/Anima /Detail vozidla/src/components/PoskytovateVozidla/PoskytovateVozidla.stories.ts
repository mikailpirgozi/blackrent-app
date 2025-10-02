import type { Meta, StoryObj } from "@storybook/react";
import { PoskytovateVozidla } from ".";

const meta: Meta<typeof PoskytovateVozidla> = {
  title: "Components/PoskytovateVozidla",
  component: PoskytovateVozidla,

  argTypes: {
    type: {
      options: ["blackrent"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof PoskytovateVozidla>;

export const Default: Story = {
  args: {
    type: "blackrent",
    className: {},
    union: "/img/union-2.svg",
  },
};
