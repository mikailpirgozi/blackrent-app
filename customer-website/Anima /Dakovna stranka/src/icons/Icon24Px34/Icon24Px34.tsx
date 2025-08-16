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

export const Icon24Px34 = ({
  color = "#646469",
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
        d="M5 3.99902C2.79086 3.99902 1 5.78988 1 7.99902V15.999C1 18.2082 2.79086 19.999 5 19.999H19C21.2091 19.999 23 18.2082 23 15.999V7.99902C23 5.78988 21.2091 3.99902 19 3.99902H5ZM4.5568 6.0483C4.69936 6.01605 4.84769 5.99902 5 5.99902H19C19.1523 5.99902 19.3007 6.01606 19.4433 6.04832L12.0001 11.7402L4.5568 6.0483ZM3.0801 7.43682C3.02796 7.61516 3 7.80383 3 7.99902V15.999C3 17.1036 3.89543 17.999 5 17.999H19C20.1046 17.999 21 17.1036 21 15.999V7.99902C21 7.80385 20.972 7.61521 20.9199 7.43688L12.6075 13.7934C12.2489 14.0676 11.7512 14.0676 11.3926 13.7934L3.0801 7.43682Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px34.propTypes = {
  color: PropTypes.string,
};
