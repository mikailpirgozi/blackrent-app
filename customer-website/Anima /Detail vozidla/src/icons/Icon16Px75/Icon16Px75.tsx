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

export const Icon16Px75 = ({
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
        d="M4.49601 3C3.07835 3.00009 2.00002 4.09625 2 5.33322C1.99999 6.12086 2.27784 6.83659 2.73884 7.27615C2.74574 7.28272 2.75253 7.28939 2.75923 7.29615L8 12.587L13.2408 7.29615C13.2475 7.28939 13.2543 7.28272 13.2612 7.27615C13.7222 6.83659 14 6.12086 14 5.33322C14 4.09625 12.9216 3.00009 11.504 3C10.4016 2.99992 9.78909 3.51453 8.75231 4.66832C8.55288 4.89027 8.27663 5.00216 8 4.99992C7.72337 5.00216 7.44712 4.89027 7.24769 4.66832C6.21091 3.51453 5.59843 2.99992 4.49601 3ZM8 2.55341C8.88076 1.69241 9.91939 0.999885 11.5041 1C13.936 1.00016 16 2.90352 16 5.33319C16 6.54079 15.582 7.81972 14.6524 8.71303L8.71854 14.7036C8.52096 14.9031 8.2602 15.0019 8 14.9998C7.7398 15.0019 7.47904 14.9031 7.28146 14.7036L1.34763 8.71303C0.418001 7.81972 -2.05032e-05 6.54079 7.60338e-10 5.33319C4.18432e-05 2.90352 2.06402 1.00016 4.49587 1M8 2.55341C7.11924 1.69241 6.0806 0.999887 4.49587 1L8 2.55341Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon16Px75.propTypes = {
  color: PropTypes.string,
};
