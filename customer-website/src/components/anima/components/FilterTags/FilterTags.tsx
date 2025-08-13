/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPx } from "../IconPx";

interface Props {
  type: "more-default" | "default";
  className: any;
  text?: string;
  iconPxTypArrowDown?: string;
}

export const FilterTags = ({
  type,
  className,
  text = "Bluetooth",
  iconPxTypArrowDown = "https://c.animaapp.com/h23eak6p/img/icon-16-px-32.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex items-center px-4 py-2 h-8 rounded-lg justify-center bg-colors-black-600 relative ${type === "more-default" ? "gap-2" : "gap-4"} ${className}`}
    >
      <div
        className={`[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm font-normal leading-6 whitespace-nowrap relative ${type === "default" ? "text-colors-ligh-gray-800" : "text-colors-light-yellow-accent-100"}`}
      >
        {type === "more-default" && <>Viac</>}

        {type === "default" && <>{text}</>}
      </div>

      {type === "more-default" && (
        <IconPx
          className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
          typ="arrow-down"
          typArrowDown={iconPxTypArrowDown}
        />
      )}
    </div>
  );
};
