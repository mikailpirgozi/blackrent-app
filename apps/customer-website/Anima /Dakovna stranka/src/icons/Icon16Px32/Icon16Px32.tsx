/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const Icon16Px32 = ({ className }: Props): JSX.Element => {
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
        d="M3.16797 14C3.44411 14 3.66797 13.7761 3.66797 13.5V8H8.66797V13.5C8.66797 13.7761 8.89183 14 9.16797 14C9.44411 14 9.66797 13.7761 9.66797 13.5V8H13.668V13.5C13.668 13.7761 13.8918 14 14.168 14C14.4441 14 14.668 13.7761 14.668 13.5V7.5C14.668 7.22386 14.4441 7 14.168 7H9.66797V1.5C9.66797 1.22386 9.44411 1 9.16797 1C8.89183 1 8.66797 1.22386 8.66797 1.5V7H3.66797V1.5C3.66797 1.22386 3.44411 1 3.16797 1C2.89183 1 2.66797 1.22386 2.66797 1.5V13.5C2.66797 13.7761 2.89183 14 3.16797 14Z"
        fill="#F0F0F5"
        fillRule="evenodd"
      />
    </svg>
  );
};
