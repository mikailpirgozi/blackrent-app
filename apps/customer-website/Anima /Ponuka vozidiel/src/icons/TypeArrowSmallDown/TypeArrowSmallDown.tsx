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

export const TypeArrowSmallDown = ({
  color = "#FAFAFF",
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
        d="M8.00003 8.99951C7.59557 8.99951 7.23093 9.24315 7.07615 9.61683C6.92137 9.9905 7.00692 10.4206 7.29292 10.7066L11.2929 14.7066C11.4805 14.8942 11.7348 14.9995 12 14.9995C12.2652 14.9995 12.5196 14.8942 12.7071 14.7066L16.7071 10.7066C16.9931 10.4206 17.0787 9.99051 16.9239 9.61683C16.7691 9.24316 16.4045 8.99951 16 8.99951L8.00003 8.99951Z"
        fill={color}
      />
    </svg>
  );
};

TypeArrowSmallDown.propTypes = {
  color: PropTypes.string,
};
