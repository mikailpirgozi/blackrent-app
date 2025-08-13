/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { BlackrentLogo } from "../BlackrentLogo";
import { TypMenuWrapper } from "../TypMenuWrapper";

interface Props {
  type: "default";
  className: any;
}

export const TypeDefaultWrapper = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[744px] h-16 items-center justify-between px-8 py-0 relative ${className}`}
    >
      <BlackrentLogo className="!h-6 bg-[url(https://c.animaapp.com/h23eak6p/img/vector-23.svg)] !relative !w-[160.8px]" />
      <TypMenuWrapper
        className="!relative !left-[unset] !top-[unset]"
        typ="menu"
        typMenu="https://c.animaapp.com/h23eak6p/img/icon-24-px-68.svg"
      />
    </div>
  );
};
