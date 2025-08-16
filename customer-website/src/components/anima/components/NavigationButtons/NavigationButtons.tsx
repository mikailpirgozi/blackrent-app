/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPx } from "../IconPx";

interface Props {
  type: "arrow-right-button-default";
}

export const NavigationButtons = ({ type }: Props): JSX.Element => {
  return (
    <div className="flex w-6 h-6 items-center justify-center gap-2 p-2 relative rounded">
      <IconPx
        className="!mr-[-4.00px] !mt-[-4.00px] !ml-[-4.00px] !mb-[-4.00px] !relative !left-[unset] !top-[unset]"
        img="/assets/misc/icon-16-px-41.svg"
        typ="arrow-right_1"
      />
    </div>
  );
};
