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

export const Icon24Px125 = ({
  color = "#E4FF56",
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
        d="M9 4C9 3.44772 9.44772 3 10 3H18C18.5523 3 19 3.44772 19 4C19 4.55228 18.5523 5 18 5H15V7H20C21.6569 7 23 8.34315 23 10V19C23 20.6569 21.6569 22 20 22H15.6842C15.425 22 15.1758 21.8993 14.9894 21.7192L12.1748 19H8C6.34314 19 5 17.6569 5 16V15H3V18C3 18.5523 2.55228 19 2 19C1.44772 19 1 18.5523 1 18V10C1 9.44772 1.44772 9 2 9C2.55228 9 3 9.44772 3 10V13H5V10C5 8.34315 6.34315 7 8 7H13V5H10C9.44772 5 9 4.55228 9 4ZM7 16C7 16.5523 7.44772 17 8 17H12.5789C12.8382 17 13.0873 17.1007 13.2738 17.2808L16.0884 20H20C20.5523 20 21 19.5523 21 19V10C21 9.44772 20.5523 9 20 9H8C7.44772 9 7 9.44772 7 10V16Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px125.propTypes = {
  color: PropTypes.string,
};
