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

export const Icon24Px31 = ({
  color = "#646469",
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
        d="M5 4C2.79086 4 1 5.79086 1 8V16C1 18.2091 2.79086 20 5 20H19C21.2091 20 23 18.2091 23 16V8C23 5.79086 21.2091 4 19 4H5ZM4.5568 6.04928C4.69936 6.01703 4.84769 6 5 6H19C19.1523 6 19.3007 6.01703 19.4433 6.04929L12.0001 11.7412L4.5568 6.04928ZM3.0801 7.43779C3.02796 7.61614 3 7.8048 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16V8C21 7.80483 20.972 7.61618 20.9199 7.43786L12.6075 13.7944C12.2489 14.0686 11.7512 14.0686 11.3926 13.7944L3.0801 7.43779Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px31.propTypes = {
  color: PropTypes.string,
};
