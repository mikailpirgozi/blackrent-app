/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  color: string;
  className: any;
}

export const TypWarring = ({
  color = "#FAFAFF",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 13C9 13.5523 8.55228 14 8 14C7.44772 14 7 13.5523 7 13C7 12.4477 7.44772 12 8 12C8.55228 12 9 12.4477 9 13Z"
        fill={color}
      />

      <path
        clipRule="evenodd"
        d="M8 2C8.55228 2 9 2.44772 9 3V9C9 9.55228 8.55228 10 8 10C7.44772 10 7 9.55228 7 9V3C7 2.44772 7.44772 2 8 2Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypWarring.propTypes = {
  color: PropTypes.string,
};
