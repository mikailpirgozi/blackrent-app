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

export const TypArrowTopRight = ({
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
        clipRule="evenodd"
        d="M4 5C3.44772 5 3 4.55228 3 4C3 3.44772 3.44772 3 4 3H12C12.5523 3 13 3.44772 13 4V12C13 12.5523 12.5523 13 12 13C11.4477 13 11 12.5523 11 12V6.41421L4.70711 12.7071C4.31658 13.0976 3.68342 13.0976 3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929L9.58579 5H4Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypArrowTopRight.propTypes = {
  color: PropTypes.string,
};
