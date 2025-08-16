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

export const Icon16Px6 = ({
  color = "#BEBEC3",
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
        d="M11.7929 7.5L8.14645 3.85355C7.95119 3.65829 7.95119 3.34171 8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L13.3536 7.64645C13.4473 7.74021 13.5 7.86739 13.5 8C13.5 8.13261 13.4473 8.25979 13.3536 8.35355L8.85355 12.8536C8.65829 13.0488 8.34171 13.0488 8.14645 12.8536C7.95118 12.6583 7.95118 12.3417 8.14645 12.1464L11.7929 8.5H3C2.72386 8.5 2.5 8.27614 2.5 8C2.5 7.72386 2.72386 7.5 3 7.5L11.7929 7.5Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px6.propTypes = {
  color: PropTypes.string,
};
