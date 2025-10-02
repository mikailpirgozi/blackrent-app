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
  color = "#3CEB82",
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
        d="M13.6805 4.26623C14.0852 4.64204 14.1086 5.27477 13.7328 5.67948L7.23281 12.6795C6.86753 13.0729 6.25681 13.1076 5.84923 12.7583L2.34923 9.75828C1.9299 9.39886 1.88134 8.76756 2.24076 8.34824C2.60018 7.92891 3.23148 7.88035 3.65081 8.23977L6.42115 10.6143L12.2672 4.31858C12.643 3.91387 13.2758 3.89043 13.6805 4.26623Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px4.propTypes = {
  color: PropTypes.string,
};
