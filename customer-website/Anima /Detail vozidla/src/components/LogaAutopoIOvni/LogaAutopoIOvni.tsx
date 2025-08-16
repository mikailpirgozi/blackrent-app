/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "blackrent-logo-20";
  className: any;
}

export const LogaAutopoIOvni = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-start gap-2 relative ${className}`}
    >
      <img
        className="relative w-[134px] h-5"
        alt="Vector"
        src="/img/vector-11.svg"
      />
    </div>
  );
};

LogaAutopoIOvni.propTypes = {
  type: PropTypes.oneOf(["blackrent-logo-20"]),
};
