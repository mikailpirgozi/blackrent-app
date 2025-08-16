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

export const TypNahon = ({
  color = "#FAFAFF",
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
        d="M4 1.5C4.55228 1.5 5 1.94772 5 2.5V4H19V2.5C19 1.94772 19.4477 1.5 20 1.5C20.5523 1.5 21 1.94772 21 2.5V7.5C21 8.05228 20.5523 8.5 20 8.5C19.4477 8.5 19 8.05228 19 7.5V6H13.4399L13.4954 18H19V16.5C19 15.9477 19.4477 15.5 20 15.5C20.5523 15.5 21 15.9477 21 16.5V21.5C21 22.0523 20.5523 22.5 20 22.5C19.4477 22.5 19 22.0523 19 21.5V20H5V21.5C5 22.0523 4.55228 22.5 4 22.5C3.44772 22.5 3 22.0523 3 21.5V16.5C3 15.9477 3.44772 15.5 4 15.5C4.55228 15.5 5 15.9477 5 16.5V18H11.4954L11.4399 6H5V7.5C5 8.05228 4.55228 8.5 4 8.5C3.44772 8.5 3 8.05228 3 7.5V2.5C3 1.94772 3.44772 1.5 4 1.5Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypNahon.propTypes = {
  color: PropTypes.string,
};
