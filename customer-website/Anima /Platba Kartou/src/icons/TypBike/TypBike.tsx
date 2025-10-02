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

export const TypBike = ({
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
        d="M6 1C5.44772 1 5 1.44772 5 2C5 2.55228 5.44772 3 6 3H11L11 7.12602C9.27477 7.57006 8 9.13616 8 11V17H7C6.44772 17 6 17.4477 6 18C6 18.5523 6.44772 19 7 19H9C9.55228 19 10 18.5523 10 18V11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11V18C14 18.5523 14.4477 19 15 19C15.5523 19 16 18.5523 16 18L16 13L18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11L16 11C16 9.13616 14.7252 7.57006 13 7.12602V3L18 3C18.5523 3 19 2.55228 19 2C19 1.44772 18.5523 1 18 1H6Z"
        fill={color}
      />

      <path
        d="M13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11V23C11 23.5523 11.4477 24 12 24C12.5523 24 13 23.5523 13 23V11Z"
        fill={color}
      />
    </svg>
  );
};

TypBike.propTypes = {
  color: PropTypes.string,
};
