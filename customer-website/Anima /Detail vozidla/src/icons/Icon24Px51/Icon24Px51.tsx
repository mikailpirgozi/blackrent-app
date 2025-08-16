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

export const Icon24Px51 = ({
  color = "#A0A0A5",
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
        d="M21.6367 7.10011V6.25872C20.5602 6.25872 19.5456 5.94938 18.7042 5.40495C17.4916 4.6378 16.613 3.40045 16.3408 1.95276C16.279 1.64342 16.2418 1.33408 16.2418 1H12.3813L12.369 16.1575C12.3071 17.8526 10.8718 19.2137 9.12711 19.2137C8.58268 19.2137 8.07536 19.0776 7.61755 18.8425C6.57818 18.3228 5.87289 17.2587 5.87289 16.0337C5.87289 14.2767 7.33296 12.8538 9.12711 12.8538C9.46119 12.8538 9.7829 12.9033 10.0922 13.0022V9.14173C9.77053 9.10461 9.44882 9.07987 9.12711 9.07987C5.19235 9.07987 2 12.198 2 16.0337C2 18.3847 3.20022 20.4758 5.04387 21.7379C6.20697 22.5298 7.60517 23 9.12711 23C13.0495 23 16.2542 19.8819 16.2542 16.0337V8.34983C17.7762 9.41395 19.6322 10.045 21.6367 10.045V7.10011Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px51.propTypes = {
  color: PropTypes.string,
};
