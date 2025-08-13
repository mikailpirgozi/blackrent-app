/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { TypeArrowRightWrapper } from "../TypeArrowRightWrapper";

interface Props {
  type: "default";
  className: any;
}

export const NumberingDesktop = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex items-center justify-center relative ${className}`}
    >
      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          1
        </div>
      </div>

      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          2
        </div>
      </div>

      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          3
        </div>
      </div>

      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          4
        </div>
      </div>

      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[1.60px] leading-6 whitespace-nowrap">
          ...
        </div>
      </div>

      <div className="flex flex-col w-8 h-8 items-center justify-center gap-2 relative rounded-lg">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          48
        </div>
      </div>

      <TypeArrowRightWrapper type="arrow-right-button-default" />
    </div>
  );
};
