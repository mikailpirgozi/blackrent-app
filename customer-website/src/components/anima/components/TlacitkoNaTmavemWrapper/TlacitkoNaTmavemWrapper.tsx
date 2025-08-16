/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  tlacitkoNaTmavem?: "normal";
  className: any;
  text?: string;
  iconPxClassName?: any;
  iconPx?: string;
  onClick?: () => void;
}

export const TlacitkoNaTmavemWrapper = ({
  tlacitkoNaTmavem,
  className,
  text = "Button",
  iconPxClassName,
  iconPx = "/assets/misc/icon-24-px-18.png",
  onClick,
}: Props): JSX.Element => {
  return (
    <button
      className={`all-[unset] box-border inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 relative bg-colors-light-yellow-accent-100 rounded-[99px] ${className}`}
      onClick={onClick}
    >
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-base tracking-[0] leading-6 whitespace-nowrap">
        {text}
      </div>

      <img
        className={`relative w-6 h-6 ${iconPxClassName}`}
        alt="Icon px"
        src={iconPx}
      />
    </button>
  );
};
