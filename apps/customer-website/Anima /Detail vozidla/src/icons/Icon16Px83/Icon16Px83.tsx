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

export const Icon16Px83 = ({
  color = "#646469",
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
      <g clipPath="url(#clip0_10240_22481)">
        <path
          clipRule="evenodd"
          d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8ZM8 7C8.55228 7 9 7.44772 9 8V11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11V8C7 7.44772 7.44772 7 8 7Z"
          fill={color}
          fillRule="evenodd"
        />

        <path
          d="M9 5C9 5.55228 8.55228 6 8 6C7.44772 6 7 5.55228 7 5C7 4.44772 7.44772 4 8 4C8.55228 4 9 4.44772 9 5Z"
          fill={color}
        />
      </g>

      <defs>
        <clipPath id="clip0_10240_22481">
          <rect fill="white" height="16" width="16" />
        </clipPath>
      </defs>
    </svg>
  );
};

Icon16Px83.propTypes = {
  color: PropTypes.string,
};
