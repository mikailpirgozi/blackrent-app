import type { Meta, StoryObj } from "@storybook/react";
import { IconPx } from ".";

const meta: Meta<typeof IconPx> = {
  title: "Components/IconPx",
  component: IconPx,

  argTypes: {
    typ: {
      options: [
        "najazd-km",
        "facebook",
        "message",
        "calendar",
        "nahon",
        "photo",
        "mobil",
        "spotreba",
        "karoseria",
        "menu",
        "prevodovka",
        "instagram",
        "vykon",
        "dvere",
        "palivo",
        "tik-tok",
        "objem-valcov",
      ],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof IconPx>;

export const Default: Story = {
  args: {
    typ: "najazd-km",
  },
};
