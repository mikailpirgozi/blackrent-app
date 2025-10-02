/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { IconPx } from "../IconPx";

interface Props {
  tlacitkoNaTmavem: "normal";
  className: any;
  text: string;
  override: JSX.Element;
  divClassName: any;
}

export const PrimaryButtons = ({
  tlacitkoNaTmavem,
  className,
  text = "Button",
  override = <IconPx typ="arrow-right" />,
  divClassName,
}: Props): JSX.Element => {
  return (
    <button
      className={`all-[unset] box-border inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 relative bg-colors-light-yellow-accent-100 rounded-[99px] ${className}`}
    >
      <div
        className={`relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-base tracking-[0] leading-6 whitespace-nowrap ${divClassName}`}
      >
        {text}
      </div>

      {override}
    </button>
  );
};

PrimaryButtons.propTypes = {
  tlacitkoNaTmavem: PropTypes.oneOf(["normal"]),
  text: PropTypes.string,
};
