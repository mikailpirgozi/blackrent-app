/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "message-hover";
  className: any;
  overlapGroupClassName: any;
  union: string;
}

export const ElementIconsDarkMedium = ({
  type,
  className,
  overlapGroupClassName,
  union = "/img/union-1.svg",
}: Props): JSX.Element => {
  return (
    <div className={`relative w-[58px] h-[60px] ${className}`}>
      <div
        className={`relative w-28 h-28 -top-3 -left-3.5 bg-[url(/img/union.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
        <img
          className="absolute w-[54px] h-[54px] top-3 left-3.5"
          alt="Union"
          src={union}
        />

        <div className="absolute w-1.5 h-1.5 top-9 left-7 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />

        <div className="absolute w-1.5 h-1.5 top-9 left-[38px] bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />

        <div className="absolute w-1.5 h-1.5 top-9 left-12 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
      </div>
    </div>
  );
};

ElementIconsDarkMedium.propTypes = {
  type: PropTypes.oneOf(["message-hover"]),
  union: PropTypes.string,
};
