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

export const TypPlus = ({
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
        d="M7.99965 2C8.55194 2 8.99965 2.44772 8.99965 3V7.00015L12.9995 7.00016C13.5518 7.00016 13.9995 7.44788 13.9995 8.00017C13.9995 8.55245 13.5518 9.00016 12.9995 9.00016L8.99965 9.00015V13C8.99965 13.5523 8.55194 14 7.99965 14C7.44737 14 6.99965 13.5523 6.99965 13V9.00015L3 9.00014C2.44771 9.00014 2 8.55242 2 8.00014C2 7.44785 2.44772 7.00014 3 7.00014L6.99965 7.00015V3C6.99965 2.44772 7.44737 2 7.99965 2Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypPlus.propTypes = {
  color: PropTypes.string,
};
