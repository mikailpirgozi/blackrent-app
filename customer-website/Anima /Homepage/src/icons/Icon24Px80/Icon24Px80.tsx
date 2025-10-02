/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const Icon24Px80 = ({ className }: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="24"
      viewBox="0 0 25 24"
      width="25"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M11.5 4C7.63401 4 4.5 7.13401 4.5 11C4.5 14.866 7.63401 18 11.5 18C15.366 18 18.5 14.866 18.5 11C18.5 7.13401 15.366 4 11.5 4ZM2.5 11C2.5 6.02944 6.52944 2 11.5 2C16.4706 2 20.5 6.02944 20.5 11C20.5 13.3799 19.5762 15.5441 18.0677 17.1535L22.207 21.2928C22.5975 21.6833 22.5975 22.3165 22.207 22.707C21.8165 23.0975 21.1833 23.0975 20.7928 22.707L16.542 18.4562C15.1036 19.4307 13.3683 20 11.5 20C6.52944 20 2.5 15.9706 2.5 11Z"
        fill="#141900"
        fillRule="evenodd"
      />
    </svg>
  );
};
