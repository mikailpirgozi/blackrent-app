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

export const Icon24PxFilled = ({
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
        d="M13 22.4984C16.9994 19.499 21 15.179 21 10.1808C21 4.96159 17.067 0.999023 12 0.999023C6.93298 0.999023 3 4.96159 3 10.1808C3 15.1787 6.96799 19.5443 11 22.499C11.6 22.917 12.4 22.941 13 22.4984ZM8 8.99902C8 6.78988 9.79086 4.99902 12 4.99902C14.2091 4.99902 16 6.78988 16 8.99902C16 11.2082 14.2091 12.999 12 12.999C9.79086 12.999 8 11.2082 8 8.99902Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24PxFilled.propTypes = {
  color: PropTypes.string,
};
