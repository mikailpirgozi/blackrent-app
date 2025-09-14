import type { Meta, StoryObj } from "@storybook/react";
import { SekcieVMenuBlack } from ".";

const meta: Meta<typeof SekcieVMenuBlack> = {
  title: "Components/SekcieVMenuBlack",
  component: SekcieVMenuBlack,

  argTypes: {
    type: {
      options: ["default"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof SekcieVMenuBlack>;

export const Default: Story = {
  args: {
    type: "default",
    className: {},
    divClassName: {},
    text: "Text sekcie",
  },
};
