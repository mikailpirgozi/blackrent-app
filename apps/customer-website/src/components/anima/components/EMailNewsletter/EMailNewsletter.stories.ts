import type { Meta, StoryObj } from "@storybook/react";
import { EMailNewsletter } from ".";

const meta: Meta<typeof EMailNewsletter> = {
  title: "Components/EMailNewsletter",
  component: EMailNewsletter,

  argTypes: {
    type: {
      options: ["default-b"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof EMailNewsletter>;

export const Default: Story = {
  args: {
    type: "default-b",
    className: {},
    divClassName: {},
  },
};
