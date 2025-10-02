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

export const Ikony25_5 = ({
  color = "#E4FF56",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="24"
      viewBox="0 0 25 24"
      width="25"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M4.66406 2C5.21635 2 5.66406 2.44772 5.66406 3V11.5H11.6641V3C11.6641 2.44772 12.1118 2 12.6641 2C13.2163 2 13.6641 2.44772 13.6641 3V11.5H19.6641V3C19.6641 2.44772 20.1118 2 20.6641 2C21.2163 2 21.6641 2.44772 21.6641 3V12.5C21.6641 13.0523 21.2163 13.5 20.6641 13.5H13.6641V21C13.6641 21.5523 13.2163 22 12.6641 22C12.1118 22 11.6641 21.5523 11.6641 21V13.5H5.66406V21C5.66406 21.5523 5.21635 22 4.66406 22C4.11178 22 3.66406 21.5523 3.66406 21V3C3.66406 2.44772 4.11178 2 4.66406 2Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Ikony25_5.propTypes = {
  color: PropTypes.string,
};
