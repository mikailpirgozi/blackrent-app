/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { Icon16Px4 } from "../../icons/Icon16Px4";

interface Props {
  className: any;
}

export const BackToTopButton = ({ className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-2 pl-5 pr-6 py-2 relative bg-colors-black-600 rounded-[99px] ${className}`}
    >
      <Icon16Px4 className="!relative !w-4 !h-4" color="#F0F0F5" />
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
        {" "}
        Späť nahor
      </div>
    </div>
  );
};
