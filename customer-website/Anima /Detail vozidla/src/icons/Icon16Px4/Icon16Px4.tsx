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

export const Icon16Px4 = ({
  color = "#F0F0F5",
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
        d="M6.20938 14.9068C5.98467 14.7463 5.93263 14.434 6.09313 14.2093L10.414 8.16019L4.57071 8.99494C4.3726 9.02324 4.17671 8.93069 4.07275 8.75969C3.9688 8.58869 3.97682 8.37218 4.09313 8.20934L9.09313 1.20934C9.25364 0.984635 9.56591 0.93259 9.79062 1.09309C10.0153 1.2536 10.0674 1.56587 9.90687 1.79058L5.58604 7.83974L11.4293 7.00499C11.6274 6.97669 11.8233 7.06923 11.9272 7.24023C12.0312 7.41123 12.0232 7.62774 11.9069 7.79058L6.90687 14.7906C6.74636 15.0153 6.43409 15.0673 6.20938 14.9068Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px4.propTypes = {
  color: PropTypes.string,
};
