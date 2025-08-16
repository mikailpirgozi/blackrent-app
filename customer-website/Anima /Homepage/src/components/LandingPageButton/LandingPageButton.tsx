/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypArrowTopRight } from "../../icons/TypArrowTopRight";

interface Props {
  property1: "default";
  icon: JSX.Element;
}

export const LandingPageButton = ({
  property1,
  icon = <TypArrowTopRight className="!relative !w-4 !h-4" color="#F0FF98" />,
}: Props): JSX.Element => {
  return (
    <div className="inline-flex h-8 items-center gap-2 pl-5 pr-0.5 py-0.5 relative bg-colors-light-yellow-accent-700 rounded-[99px] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)]">
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-sm tracking-[0] leading-8 whitespace-nowrap">
        Ponuka vozidiel
      </div>

      <div className="flex w-7 h-7 items-center justify-center gap-2 relative bg-colors-dark-yellow-accent-100 rounded-[99px] overflow-hidden">
        {icon}
      </div>
    </div>
  );
};

LandingPageButton.propTypes = {
  property1: PropTypes.oneOf(["default"]),
};
