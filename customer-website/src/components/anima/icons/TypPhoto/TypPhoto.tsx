/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const TypPhoto = ({ className }: Props): JSX.Element => {
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
        d="M7.75 10C8.57843 10 9.25 9.32843 9.25 8.5C9.25 7.67157 8.57843 7 7.75 7C6.92157 7 6.25 7.67157 6.25 8.5C6.25 9.32843 6.92157 10 7.75 10Z"
        fill="#FAFAFF"
      />

      <path
        clipRule="evenodd"
        d="M7.25 2C4.48858 2 2.25 4.23858 2.25 7V17C2.25 19.7614 4.48858 22 7.25 22H17.25C20.0114 22 22.25 19.7614 22.25 17V7C22.25 4.23858 20.0114 2 17.25 2H7.25ZM4.25 7C4.25 5.34315 5.59315 4 7.25 4H17.25C18.9069 4 20.25 5.34315 20.25 7V11.8898L16.3832 8.72604C15.9715 8.38913 15.368 8.43364 15.0101 8.82733L5.41947 19.377C4.70819 18.8284 4.25 17.9677 4.25 17V7ZM15.8514 10.875L20.25 14.4739V17C20.25 18.6569 18.9069 20 17.25 20H7.55601L15.8514 10.875Z"
        fill="#FAFAFF"
        fillRule="evenodd"
      />
    </svg>
  );
};
