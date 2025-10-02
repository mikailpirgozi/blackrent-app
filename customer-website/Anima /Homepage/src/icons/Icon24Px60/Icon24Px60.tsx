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

export const Icon24Px60 = ({
  color = "#646469",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="25"
      viewBox="0 0 24 25"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M5 4.05859C2.79086 4.05859 1 5.84945 1 8.05859V16.0586C1 18.2677 2.79086 20.0586 5 20.0586H19C21.2091 20.0586 23 18.2677 23 16.0586V8.05859C23 5.84945 21.2091 4.05859 19 4.05859H5ZM4.5568 6.10787C4.69936 6.07562 4.84769 6.05859 5 6.05859H19C19.1523 6.05859 19.3007 6.07563 19.4433 6.10789L12.0001 11.7998L4.5568 6.10787ZM3.0801 7.49639C3.02796 7.67473 3 7.8634 3 8.05859V16.0586C3 17.1632 3.89543 18.0586 5 18.0586H19C20.1046 18.0586 21 17.1632 21 16.0586V8.05859C21 7.86342 20.972 7.67478 20.9199 7.49645L12.6075 13.853C12.2489 14.1272 11.7512 14.1272 11.3926 13.853L3.0801 7.49639Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px60.propTypes = {
  color: PropTypes.string,
};
