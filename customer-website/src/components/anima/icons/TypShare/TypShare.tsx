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

export const TypShare = ({
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
      <g clipPath="url(#clip0_10826_33435)">
        <path
          clipRule="evenodd"
          d="M15.7286 0.315136C16.001 0.604879 16.0758 1.02846 15.9191 1.39395L9.91915 15.394C9.74759 15.7942 9.33671 16.0375 8.90325 15.9953C8.4698 15.9532 8.11345 15.6354 8.0222 15.2096L6.64514 8.78327L0.705916 6.95581C0.294172 6.82912 0.0098396 6.45298 0.000249813 6.0223C-0.00933992 5.59161 0.257968 5.20318 0.663666 5.05829L14.6637 0.0582929C15.0381 -0.0754513 15.4563 0.0253933 15.7286 0.315136ZM4.17091 5.92943L7.79409 7.04426C8.14034 7.1508 8.4019 7.43627 8.4778 7.79051L9.31915 11.7168L13.1781 2.71258L4.17091 5.92943Z"
          fill={color}
          fillRule="evenodd"
        />
      </g>

      <defs>
        <clipPath id="clip0_10826_33435">
          <rect fill="white" height="16" width="16" />
        </clipPath>
      </defs>
    </svg>
  );
};

TypShare.propTypes = {
  color: PropTypes.string,
};
