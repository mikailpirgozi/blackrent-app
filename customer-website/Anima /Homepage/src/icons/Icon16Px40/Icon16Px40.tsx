/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const Icon16Px40 = ({ className }: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="16"
      viewBox="0 0 17 16"
      width="17"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M4.5 5C3.94772 5 3.5 4.55228 3.5 4C3.5 3.44772 3.94772 3 4.5 3H12.5C13.0523 3 13.5 3.44772 13.5 4V12C13.5 12.5523 13.0523 13 12.5 13C11.9477 13 11.5 12.5523 11.5 12V6.41421L5.20711 12.7071C4.81658 13.0976 4.18342 13.0976 3.79289 12.7071C3.40237 12.3166 3.40237 11.6834 3.79289 11.2929L10.0858 5H4.5Z"
        fill="#F0FF98"
        fillRule="evenodd"
      />
    </svg>
  );
};
