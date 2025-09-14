/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPx } from "../IconPx";

interface Props {
  className: any;
}

export const BackToTopButton = ({ className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-2 pl-5 pr-6 py-2 relative bg-colors-black-600 rounded-[99px] ${className}`}
    >
      <IconPx
        className="!relative !left-[unset] !top-[unset]"
        typ="arrow-top"
        typArrowTop="/assets/misc/icon-16-px-42.svg"
      />
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
        {" "}
        Späť nahor
      </div>
    </div>
  );
};
