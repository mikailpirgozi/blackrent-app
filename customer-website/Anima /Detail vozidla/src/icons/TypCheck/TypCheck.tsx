/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  className: any;
}

export const TypCheck = ({ className }: Props): JSX.Element => {
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
        d="M13.6805 4.26721C14.0852 4.64301 14.1086 5.27574 13.7328 5.68046L7.23281 12.6805C6.86753 13.0738 6.25681 13.1086 5.84923 12.7593L2.34923 9.75926C1.9299 9.39984 1.88134 8.76854 2.24076 8.34921C2.60018 7.92989 3.23148 7.88133 3.65081 8.24075L6.42115 10.6153L12.2672 4.31955C12.643 3.91484 13.2758 3.89141 13.6805 4.26721Z"
        fill="#FAFAFF"
        fillRule="evenodd"
      />
    </svg>
  );
};
