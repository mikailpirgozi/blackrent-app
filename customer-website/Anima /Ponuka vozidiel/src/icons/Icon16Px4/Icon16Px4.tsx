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
        d="M2.30071 10.71C1.91018 10.3195 1.91018 9.68635 2.30071 9.29582L7.30071 4.29582C7.69123 3.9053 8.3244 3.9053 8.71492 4.29582L13.7149 9.29582C14.1054 9.68635 14.1054 10.3195 13.7149 10.71C13.3244 11.1006 12.6912 11.1006 12.3007 10.71L8.00781 6.41714L3.71492 10.71C3.3244 11.1006 2.69123 11.1006 2.30071 10.71Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px4.propTypes = {
  color: PropTypes.string,
};
