/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  property1: "default";
}

export const UnderFooter1 = ({ property1 }: Props): JSX.Element => {
  return (
    <div className="flex w-[1728px] h-24 items-center gap-2 px-[200px] py-0 relative bg-black">
      <p className="relative w-[855px] h-2 [font-family:'Poppins',Helvetica] font-normal text-colors-black-1000 text-xs tracking-[0] leading-6 whitespace-nowrap">
        © 2024 blackrent.sk | Obchodné podmienky | Pravidlá pre súbory cookies |
        Reklamačný poriadok |&nbsp;&nbsp;Ochrana osobných údajov
      </p>
    </div>
  );
};

UnderFooter1.propTypes = {
  property1: PropTypes.oneOf(["default"]),
};
