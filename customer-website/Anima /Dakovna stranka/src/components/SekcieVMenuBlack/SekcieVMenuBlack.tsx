/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "default";
  className: any;
  divClassName: any;
  text: string;
}

export const SekcieVMenuBlack = ({
  type,
  className,
  divClassName,
  text = "Text sekcie",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center gap-2 p-2 relative ${className}`}
    >
      <div
        className={`relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap ${divClassName}`}
      >
        {text}
      </div>
    </div>
  );
};

SekcieVMenuBlack.propTypes = {
  type: PropTypes.oneOf(["default"]),
  text: PropTypes.string,
};
