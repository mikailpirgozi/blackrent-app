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

export const Ikony25_4 = ({
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
        d="M7 4C6.44772 4 6 4.44772 6 5V20H15V5C15 4.44772 14.5523 4 14 4H7ZM17 20V5C17 3.34315 15.6569 2 14 2H7C5.34315 2 4 3.34315 4 5V20H3C2.44772 20 2 20.4477 2 21C2 21.5523 2.44772 22 3 22H20C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20H17ZM18.5343 6.11508C19.023 5.85786 19.6277 6.04553 19.8849 6.53425L20.9375 8.53425C21.0142 8.67997 21.0538 8.84236 21.0526 9.00702L21 16.507C20.9961 17.0593 20.5453 17.5039 19.993 17.5C19.4407 17.4961 18.9961 17.0453 19 16.493L19.0509 9.24379L18.1151 7.46575C17.8579 6.97702 18.0455 6.37231 18.5343 6.11508ZM8 11C8 10.4477 8.44772 10 9 10H12C12.5523 10 13 10.4477 13 11C13 11.5523 12.5523 12 12 12H9C8.44772 12 8 11.5523 8 11Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Ikony25_4.propTypes = {
  color: PropTypes.string,
};
