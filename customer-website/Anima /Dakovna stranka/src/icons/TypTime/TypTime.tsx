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

export const TypTime = ({
  color = "#F0FF98",
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
        clipRule="evenodd"
        d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12ZM12 6C12.5523 6 13 6.44772 13 7V12H16C16.5523 12 17 12.4477 17 13C17 13.5523 16.5523 14 16 14H12C11.4477 14 11 13.5523 11 13V7C11 6.44772 11.4477 6 12 6Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypTime.propTypes = {
  color: PropTypes.string,
};
