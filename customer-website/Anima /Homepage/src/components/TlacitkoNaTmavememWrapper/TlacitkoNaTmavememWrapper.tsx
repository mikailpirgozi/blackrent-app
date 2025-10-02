/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px111 } from "../../icons/Icon24Px111";

interface Props {
  tlacitkoNaTmavemem40: "normal";
  className: any;
  divClassName: any;
  text: string;
}

export const TlacitkoNaTmavememWrapper = ({
  tlacitkoNaTmavemem40,
  className,
  divClassName,
  text = "Button",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-1.5 pl-6 pr-5 py-2 relative bg-colors-light-green-accent-100 rounded-[99px] ${className}`}
    >
      <div
        className={`relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-dark-green-accent-100 text-base tracking-[0] leading-6 whitespace-nowrap ${divClassName}`}
      >
        {text}
      </div>

      <Icon24Px111 className="!relative !w-6 !h-6" color="#141900" />
    </div>
  );
};

TlacitkoNaTmavememWrapper.propTypes = {
  tlacitkoNaTmavemem40: PropTypes.oneOf(["normal"]),
  text: PropTypes.string,
};
