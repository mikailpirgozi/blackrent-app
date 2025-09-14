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

export const Icon24Px22 = ({
  color = "#FF505A",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.9999 16.9999L11.9999 11.9999M11.9999 11.9999L7 7M11.9999 11.9999L16.9999 6.99993M11.9999 11.9999L7 16.9999"
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
};

Icon24Px22.propTypes = {
  color: PropTypes.string,
};
