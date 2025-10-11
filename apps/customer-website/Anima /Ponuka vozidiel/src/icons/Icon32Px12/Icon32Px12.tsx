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

export const Icon32Px12 = ({
  color = "#BEBEC3",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="33"
      viewBox="0 0 32 33"
      width="32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M8 9.77734C8 9.22506 8.44772 8.77734 9 8.77734H23C23.5523 8.77734 24 9.22506 24 9.77734V23.7773C24 24.3296 23.5523 24.7773 23 24.7773C22.4477 24.7773 22 24.3296 22 23.7773V12.1916L9.70717 24.4844C9.31664 24.875 8.68348 24.875 8.29295 24.4844C7.90243 24.0939 7.90243 23.4608 8.29295 23.0702L20.5858 10.7773H9C8.44772 10.7773 8 10.3296 8 9.77734Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon32Px12.propTypes = {
  color: PropTypes.string,
};
