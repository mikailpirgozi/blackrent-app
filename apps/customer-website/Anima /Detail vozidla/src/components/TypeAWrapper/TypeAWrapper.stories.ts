import type { Meta, StoryObj } from "@storybook/react";
import { TypeAWrapper } from ".";

const meta: Meta<typeof TypeAWrapper> = {
  title: "Components/TypeAWrapper",
  component: TypeAWrapper,

  argTypes: {
    type: {
      options: ["a"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof TypeAWrapper>;

export const Default: Story = {
  args: {
    type: "a",
    className: {},
    componentBlackrentLogoClassName: {},
    componentVector: "/img/vector-7.svg",
    rychlyKontaktMobilLine: "/img/line-21-1.svg",
    rychlyKontaktMobilFotkaOperToraClassName: {},
    rychlyKontaktMobilVector: "/img/vector-3.svg",
  },
};
