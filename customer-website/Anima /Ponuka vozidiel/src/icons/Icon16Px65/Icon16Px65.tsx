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

export const Icon16Px65 = ({
  color = "#FF505A",
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
        d="M12.707 3.29289C13.0976 3.68342 13.0976 4.31658 12.707 4.70711L9.41415 8L12.707 11.2929C13.0976 11.6834 13.0976 12.3166 12.707 12.7071C12.3165 13.0976 11.6834 13.0976 11.2928 12.7071L7.99993 9.41421L4.70711 12.707C4.31658 13.0976 3.68342 13.0976 3.29289 12.707C2.90237 12.3165 2.90237 11.6834 3.29289 11.2928L6.58572 8L3.29289 4.70717C2.90237 4.31665 2.90237 3.68348 3.29289 3.29296C3.68342 2.90244 4.31658 2.90244 4.70711 3.29296L7.99993 6.58579L11.2928 3.29289C11.6834 2.90237 12.3165 2.90237 12.707 3.29289Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px65.propTypes = {
  color: PropTypes.string,
};
