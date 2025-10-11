/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  stav: "radio-selected" | "radio-default";
}

export const CheckBoxy = ({ stav }: Props): JSX.Element => {
  return (
    <div className="w-6 h-6 relative">
      <div
        className={`w-5 left-0.5 top-0.5 h-5 rounded-[10px] relative ${stav === "radio-default" ? "border-2 border-solid" : ""} ${stav === "radio-default" ? "border-colors-dark-gray-900" : ""} ${stav === "radio-selected" ? "bg-colors-dark-yellow-accent-300" : ""}`}
      >
        {stav === "radio-selected" && (
          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
        )}
      </div>
    </div>
  );
};

CheckBoxy.propTypes = {
  stav: PropTypes.oneOf(["radio-selected", "radio-default"]),
};
