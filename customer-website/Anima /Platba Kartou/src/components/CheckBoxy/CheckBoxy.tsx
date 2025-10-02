/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { CheckBoxy24_1 } from "../../icons/CheckBoxy24_1";

interface Props {
  stav:
    | "switch-default"
    | "radio-selected"
    | "square-default"
    | "radio-hover"
    | "radio-default";
}

export const CheckBoxy = ({ stav }: Props): JSX.Element => {
  return (
    <>
      {[
        "radio-default",
        "radio-selected",
        "square-default",
        "switch-default",
      ].includes(stav) && (
        <div
          className={`h-6 relative ${stav === "switch-default" ? "w-[42px]" : "w-6"} ${stav === "switch-default" ? "flex" : ""} ${stav === "switch-default" ? "items-center" : ""} ${stav === "switch-default" ? "p-1" : ""} ${stav === "switch-default" ? "overflow-hidden" : ""} ${stav === "switch-default" ? "rounded-[99px]" : ""} ${stav === "switch-default" ? "bg-colors-black-800" : ""}`}
        >
          <div
            className={`relative ${["radio-default", "square-default"].includes(stav) ? "border-2 border-solid" : ""} ${["radio-default", "square-default"].includes(stav) ? "border-colors-dark-gray-900" : ""} ${stav === "switch-default" ? "w-4" : "w-5"} ${["radio-default", "radio-selected", "square-default"].includes(stav) ? "left-0.5" : ""} ${["radio-default", "radio-selected", "square-default"].includes(stav) ? "top-0.5" : ""} ${stav === "switch-default" ? "h-4" : "h-5"} ${stav === "square-default" ? "rounded-md" : (stav === "switch-default") ? "rounded-lg" : "rounded-[10px]"} ${stav === "radio-selected" ? "bg-colors-dark-yellow-accent-300" : (stav === "switch-default") ? "bg-colors-dark-gray-900" : ""}`}
          >
            {stav === "radio-selected" && (
              <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
            )}
          </div>
        </div>
      )}

      {stav === "radio-hover" && (
        <CheckBoxy24_1 className="!absolute !w-6 !h-6 !top-0 !left-0" />
      )}
    </>
  );
};

CheckBoxy.propTypes = {
  stav: PropTypes.oneOf([
    "switch-default",
    "radio-selected",
    "square-default",
    "radio-hover",
    "radio-default",
  ]),
};
