/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypArrowRight } from "../../icons/TypArrowRight";

interface Props {
  tlacitkoNaTmavemem40: "tlacitko-na-tmavemem-403";
  text: string;
  icon: JSX.Element;
  className: any;
}

export const PrimaryButtons40PxIcon = ({
  tlacitkoNaTmavemem40,
  text = "Button",
  icon = <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />,
  className,
}: Props): JSX.Element => {
  return (
    <button
      className={`all-[unset] box-border inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 relative bg-colors-light-yellow-accent-100 rounded-[99px] ${className}`}
    >
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
        {text}
      </div>

      {icon}
    </button>
  );
};

PrimaryButtons40PxIcon.propTypes = {
  tlacitkoNaTmavemem40: PropTypes.oneOf(["tlacitko-na-tmavemem-403"]),
  text: PropTypes.string,
};
