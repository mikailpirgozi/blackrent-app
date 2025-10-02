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

export const Icon16Px100 = ({
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
        d="M2.5 14C2.77614 14 3 13.7761 3 13.5V8H8V13.5C8 13.7761 8.22386 14 8.5 14C8.77614 14 9 13.7761 9 13.5V8H13V13.5C13 13.7761 13.2239 14 13.5 14C13.7761 14 14 13.7761 14 13.5V7.5C14 7.22386 13.7761 7 13.5 7H9V1.5C9 1.22386 8.77614 1 8.5 1C8.22386 1 8 1.22386 8 1.5V7H3V1.5C3 1.22386 2.77614 1 2.5 1C2.22386 1 2 1.22386 2 1.5V13.5C2 13.7761 2.22386 14 2.5 14Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px100.propTypes = {
  color: PropTypes.string,
};
