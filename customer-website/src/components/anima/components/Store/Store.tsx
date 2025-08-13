/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  state?: "default";
  className: any;
}

export const Store = ({ state, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-2 px-4 py-3 relative rounded-lg ${className}`}
    >
      <div className="relative w-6 h-6 mt-[-4.00px] mb-[-4.00px]">
        <img
          className="absolute w-5 h-5 top-0.5 left-0.5"
          alt="Union"
          src="https://c.animaapp.com/h23eak6p/img/union-3.svg"
        />
      </div>

      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
        SK
      </div>
    </div>
  );
};
