/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px4 } from "../../icons/Icon16Px4";
import { TypWarring } from "../../icons/TypWarring";

interface Props {
  type: "check-green" | "warring" | "check-lime";
  className: any;
}

export const IconColor = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex items-start gap-2 p-2 rounded-[99px] relative ${type === "check-lime" ? "bg-colors-dark-yellow-accent-200" : (type === "warring") ? "bg-colors-dark-yellow-accent-100" : "bg-colors-green-accent-100"} ${className}`}
    >
      {["check-green", "check-lime"].includes(type) && (
        <Icon16Px4
          className="!relative !w-4 !h-4"
          color={type === "check-lime" ? "#E4FF56" : "#3CEB82"}
        />
      )}

      {type === "warring" && (
        <TypWarring className="!relative !w-4 !h-4" color="#E4FF56" />
      )}
    </div>
  );
};

IconColor.propTypes = {
  type: PropTypes.oneOf(["check-green", "warring", "check-lime"]),
};
