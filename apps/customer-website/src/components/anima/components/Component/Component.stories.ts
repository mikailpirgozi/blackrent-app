import type { Meta, StoryObj } from "@storybook/react";
import { Component } from ".";

const meta: Meta<typeof Component> = {
  title: "Components/Component",
  component: Component,

  argTypes: {
    property1: {
      options: ["frame-994"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    property1: "frame-994",
    className: {},
    blackrentLogoClassName: {},
    vector: "/img/vector-7.svg",
  },
};
