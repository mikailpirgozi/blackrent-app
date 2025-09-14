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

export const Ikony25_23 = ({
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
        d="M12.0001 2C12.5524 2 13.0001 2.44772 13.0001 3V7C13.0001 7.55228 12.5524 8 12.0001 8C11.4478 8 11.0001 7.55228 11.0001 7V3C11.0001 2.44772 11.4478 2 12.0001 2ZM18.8897 2.00625C19.4386 1.94526 19.933 2.3408 19.994 2.88971L21.994 20.8898C22.055 21.4388 21.6594 21.9332 21.1105 21.9942C20.5616 22.0551 20.0672 21.6596 20.0062 21.1107L18.0062 3.11057C17.9452 2.56166 18.3408 2.06724 18.8897 2.00625ZM5.11052 2.00639C5.65943 2.06738 6.05496 2.5618 5.99397 3.11071L3.99397 21.1107C3.93298 21.6596 3.43856 22.0551 2.88966 21.9942C2.34075 21.9332 1.94521 21.4387 2.0062 20.8898L4.0062 2.88984C4.06719 2.34094 4.56161 1.9454 5.11052 2.00639ZM12.0001 12.0001C12.5524 12.0001 13.0001 12.4479 13.0001 13.0001V17.0001C13.0001 17.5524 12.5524 18.0001 12.0001 18.0001C11.4478 18.0001 11.0001 17.5524 11.0001 17.0001V13.0001C11.0001 12.4479 11.4478 12.0001 12.0001 12.0001Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Ikony25_23.propTypes = {
  color: PropTypes.string,
};
