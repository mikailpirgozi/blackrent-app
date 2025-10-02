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

export const Ikony25_21 = ({
  color = "#A0A0A5",
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
        d="M8 2C8.55228 2 9 2.44772 9 3V4H15V3C15 2.44772 15.4477 2 16 2C16.5523 2 17 2.44772 17 3V4H18C20.2091 4 22 5.79086 22 8V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V8C2 5.79086 3.79086 4 6 4H7V3C7 2.44772 7.44772 2 8 2ZM7 6H6C4.89543 6 4 6.89543 4 8V10H20V8C20 6.89543 19.1046 6 18 6H17V7C17 7.55228 16.5523 8 16 8C15.4477 8 15 7.55228 15 7V6H9V7C9 7.55228 8.55228 8 8 8C7.44772 8 7 7.55228 7 7V6ZM20 12H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Ikony25_21.propTypes = {
  color: PropTypes.string,
};
