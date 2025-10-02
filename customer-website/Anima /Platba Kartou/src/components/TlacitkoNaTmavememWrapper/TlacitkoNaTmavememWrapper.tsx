/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypArrowRight1 } from "../../icons/TypArrowRight1";

interface Props {
  tlacitkoNaTmavemem40: "tlacitko-na-tmavemem-403";
  className: any;
  text: string;
}

export const TlacitkoNaTmavememWrapper = ({
  tlacitkoNaTmavemem40,
  className,
  text = "Button",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 relative bg-colors-light-yellow-accent-100 rounded-[99px] ${className}`}
    >
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-yellow-accent-100 text-sm tracking-[0] leading-6 whitespace-nowrap">
        {text}
      </div>

      <TypArrowRight1 className="!relative !w-4 !h-4" color="#141900" />
    </div>
  );
};

TlacitkoNaTmavememWrapper.propTypes = {
  tlacitkoNaTmavemem40: PropTypes.oneOf(["tlacitko-na-tmavemem-403"]),
  text: PropTypes.string,
};
