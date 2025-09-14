/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const TypPrevodovka = ({ className }: Props): JSX.Element => {
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
        d="M2.5 2C2.77614 2 3 2.22386 3 2.5V8H8V2.5C8 2.22386 8.22386 2 8.5 2C8.77614 2 9 2.22386 9 2.5V8H13V2.5C13 2.22386 13.2239 2 13.5 2C13.7761 2 14 2.22386 14 2.5V8.5C14 8.77614 13.7761 9 13.5 9H9V14.5C9 14.7761 8.77614 15 8.5 15C8.22386 15 8 14.7761 8 14.5V9H3V14.5C3 14.7761 2.77614 15 2.5 15C2.22386 15 2 14.7761 2 14.5V2.5C2 2.22386 2.22386 2 2.5 2Z"
        fill="#FAFAFF"
        fillRule="evenodd"
      />
    </svg>
  );
};
