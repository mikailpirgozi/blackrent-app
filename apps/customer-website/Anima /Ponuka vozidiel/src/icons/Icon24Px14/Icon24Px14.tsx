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

export const Icon24Px14 = ({
  color = "#E4FF56",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="24"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M2.10703 2.5499C2.27699 2.2127 2.6224 2 3.00001 2H21C21.3776 2 21.723 2.2127 21.893 2.5499C22.0629 2.8871 22.0285 3.29128 21.8039 3.59482L15 12.7897V21C15 21.3466 14.8206 21.6684 14.5257 21.8507C14.2309 22.0329 13.8628 22.0494 13.5528 21.8944L9.55279 19.8944C9.21401 19.725 9.00001 19.3788 9.00001 19V12.7897L2.19615 3.59482C1.97154 3.29128 1.93707 2.8871 2.10703 2.5499ZM4.98396 4L10.8039 11.8652C10.9313 12.0373 11 12.2458 11 12.46V18.382L13 19.382V12.46C13 12.2458 13.0688 12.0373 13.1961 11.8652L19.016 4H4.98396Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px14.propTypes = {
  color: PropTypes.string,
};
