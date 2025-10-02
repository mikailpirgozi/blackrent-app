/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const TypeArrowDown = ({ className }: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="8"
      viewBox="0 0 8 8"
      width="8"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_10413_18296)">
        <path
          clipRule="evenodd"
          d="M7.87964 2.17461C8.05935 2.38428 8.03507 2.69993 7.8254 2.87964L4.32541 5.87964C4.13816 6.04013 3.86186 6.04013 3.67461 5.87964L0.174613 2.87964C-0.0350495 2.69993 -0.0593303 2.38428 0.120381 2.17461C0.300092 1.96495 0.615742 1.94067 0.825405 2.12038L4.00001 4.84147L7.17461 2.12038C7.38428 1.94067 7.69993 1.96495 7.87964 2.17461Z"
          fill="#FAFAFF"
          fillRule="evenodd"
        />
      </g>

      <defs>
        <clipPath id="clip0_10413_18296">
          <rect
            fill="white"
            height="8"
            transform="matrix(1 0 0 -1 0 8)"
            width="8"
          />
        </clipPath>
      </defs>
    </svg>
  );
};
