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

export const TypArrowRight1 = ({
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
        d="M7.29177 1.34367C7.6823 0.95315 8.31546 0.95315 8.70599 1.34367L14.6557 7.29342C14.8433 7.48096 14.9486 7.73531 14.9486 8.00053C14.9486 8.26575 14.8433 8.5201 14.6557 8.70764L8.70599 14.6574C8.31546 15.0479 7.6823 15.0479 7.29177 14.6574C6.90125 14.2669 6.90125 13.6337 7.29177 13.2432L11.5345 9.00049L2.04883 9.00049C1.49654 9.00049 1.04883 8.55278 1.04883 8.00049C1.04883 7.44821 1.49654 7.00049 2.04883 7.00049L11.5344 7.00049L7.29177 2.75789C6.90125 2.36736 6.90125 1.7342 7.29177 1.34367Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypArrowRight1.propTypes = {
  color: PropTypes.string,
};
