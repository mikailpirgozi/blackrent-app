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

export const Ikony25_22 = ({
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
        d="M8 1C8 0.447715 8.44772 0 9 0H15C15.5523 0 16 0.447715 16 1H18C19.6569 1 21 2.34314 21 4V21C21 22.6569 19.6569 24 18 24H6C4.34315 24 3 22.6569 3 21V4C3 2.34315 4.34315 1 6 1H8ZM8 3H6C5.44772 3 5 3.44772 5 4V21C5 21.5523 5.44772 22 6 22H18C18.5523 22 19 21.5523 19 21V4C19 3.44772 18.5523 3 18 3H16C16 3.55228 15.5523 4 15 4H9C8.44772 4 8 3.55228 8 3ZM7 9C7 8.44772 7.44772 8 8 8H12C12.5523 8 13 8.44772 13 9C13 9.55229 12.5523 10 12 10H8C7.44772 10 7 9.55229 7 9ZM7 13C7 12.4477 7.44772 12 8 12H16C16.5523 12 17 12.4477 17 13C17 13.5523 16.5523 14 16 14H8C7.44772 14 7 13.5523 7 13ZM7 17C7 16.4477 7.44772 16 8 16H16C16.5523 16 17 16.4477 17 17C17 17.5523 16.5523 18 16 18H8C7.44772 18 7 17.5523 7 17Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Ikony25_22.propTypes = {
  color: PropTypes.string,
};
