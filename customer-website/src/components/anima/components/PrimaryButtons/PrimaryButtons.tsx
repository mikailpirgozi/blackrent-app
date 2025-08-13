/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPx } from "../IconPx";

interface Props {
  tlacitkoNaTmavemem40?: "tlacitko-na-tmavemem-403";
  className: any;
  text?: string;
  iconPxTypArrowRight?: string;
}

export const PrimaryButtons = ({
  tlacitkoNaTmavemem40,
  className,
  text = "Button",
  iconPxTypArrowRight = "https://c.animaapp.com/h23eak6p/img/icon-16-px-69.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 relative bg-colors-light-yellow-accent-100 rounded-[99px] ${className}`}
    >
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
        {text}
      </div>

      <IconPx
        className="!relative !left-[unset] !top-[unset]"
        typ="arrow-right"
        typArrowRight={iconPxTypArrowRight}
      />
    </div>
  );
};
