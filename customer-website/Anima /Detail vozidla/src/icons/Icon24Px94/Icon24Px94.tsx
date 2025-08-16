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

export const Icon24Px94 = ({
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
        d="M3 15C3 10.0294 7.02944 6 12 6C16.9706 6 21 10.0294 21 15C21 15.5523 21.4477 16 22 16C22.5523 16 23 15.5523 23 15C23 8.92487 18.0751 4 12 4C5.92487 4 1 8.92487 1 15C1 15.5523 1.44772 16 2 16C2.55228 16 3 15.5523 3 15Z"
        fill={color}
      />

      <path
        d="M17.2071 12.2071C17.5976 11.8166 17.5976 11.1834 17.2071 10.7929C16.8166 10.4024 16.1834 10.4024 15.7929 10.7929L12.518 14.0677C12.3528 14.0236 12.1792 14 12 14C10.8954 14 10 14.8954 10 16C10 17.1046 10.8954 18 12 18C13.1046 18 14 17.1046 14 16C14 15.8208 13.9764 15.6472 13.9323 15.482L17.2071 12.2071Z"
        fill={color}
      />
    </svg>
  );
};

Icon24Px94.propTypes = {
  color: PropTypes.string,
};
