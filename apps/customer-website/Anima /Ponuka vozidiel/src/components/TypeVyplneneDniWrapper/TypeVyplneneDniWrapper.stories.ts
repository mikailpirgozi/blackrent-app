import type { Meta, StoryObj } from "@storybook/react";
import { TypeVyplneneDniWrapper } from ".";

const meta: Meta<typeof TypeVyplneneDniWrapper> = {
  title: "Components/TypeVyplneneDniWrapper",
  component: TypeVyplneneDniWrapper,

  argTypes: {
    type: {
      options: ["vyplnene-dni-osa"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TypeVyplneneDniWrapper>;

export const Default: Story = {
  args: {
    type: "vyplnene-dni-osa",
    className: {},
    frameClassName: {},
  },
};
