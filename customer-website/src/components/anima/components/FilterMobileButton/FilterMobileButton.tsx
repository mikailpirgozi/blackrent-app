/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { TypMenuWrapper } from "../TypMenuWrapper";

interface Props {
  state?: "default";
  className: any;
}

export const FilterMobileButton = ({
  state,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[328px] h-[72px] items-center justify-center gap-2 px-6 py-4 relative bg-colors-black-600 rounded-2xl ${className}`}
    >
      <TypMenuWrapper
        className="!relative !left-[unset] !top-[unset]"
        typ="filter-1"
        typFilter="https://c.animaapp.com/h23eak6p/img/icon-24-px-60.svg"
      />
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
        Filtrácia
      </div>
    </div>
  );
};
