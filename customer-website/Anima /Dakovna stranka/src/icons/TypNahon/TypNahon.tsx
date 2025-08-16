/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const TypNahon = ({ className }: Props): JSX.Element => {
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
        d="M2.50004 1C2.77619 1.00002 3.00002 1.2239 3 1.50004L2.99987 3H13V1.5C13 1.22386 13.2239 1 13.5 1C13.7761 1 14 1.22386 14 1.5V5.5C14 5.77614 13.7761 6 13.5 6C13.2239 6 13 5.77614 13 5.5V4H8.5004V12H13V10.5C13 10.2239 13.2239 10 13.5 10C13.7761 10 14 10.2239 14 10.5V14.5C14 14.7761 13.7761 15 13.5 15C13.2239 15 13 14.7761 13 14.5V13H2.99987L3 14.5C3.00002 14.7761 2.77619 15 2.50004 15C2.2239 15 2.00002 14.7762 2 14.5V10.5C2.00002 10.2238 2.2239 9.99998 2.50004 10C2.77619 10 3.00002 10.2239 3 10.5L2.99987 12H7.5004V4H2.99987L3 5.49996C3.00002 5.7761 2.77619 5.99998 2.50004 6C2.2239 6.00002 2.00002 5.77619 2 5.50004V1.49996C2.00002 1.22381 2.2239 0.999976 2.50004 1Z"
        fill="#FAFAFF"
        fillRule="evenodd"
      />
    </svg>
  );
};
