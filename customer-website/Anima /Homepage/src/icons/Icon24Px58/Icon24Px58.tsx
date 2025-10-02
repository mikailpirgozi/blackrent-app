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

export const Icon24Px58 = ({
  color = "#8CA40C",
  className,
}: Props): JSX.Element => {
  return (
    <svg
      className={`${className}`}
      fill="none"
      height="25"
      viewBox="0 0 24 25"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 19.0586C12.5523 19.0586 13 18.6109 13 18.0586C13 17.5063 12.5523 17.0586 12 17.0586C11.4477 17.0586 11 17.5063 11 18.0586C11 18.6109 11.4477 19.0586 12 19.0586Z"
        fill={color}
      />

      <path
        clipRule="evenodd"
        d="M19 5.05859C19 2.84946 17.2091 1.05859 15 1.05859L9 1.05859C6.79086 1.05859 5 2.84945 5 5.05859L5 19.0586C5 21.2677 6.79086 23.0586 9 23.0586H15C17.2091 23.0586 19 21.2677 19 19.0586V5.05859ZM15 3.05859C16.1046 3.05859 17 3.95402 17 5.05859V19.0586C17 20.1632 16.1046 21.0586 15 21.0586H9C7.89543 21.0586 7 20.1632 7 19.0586L7 5.05859C7 3.95402 7.89543 3.05859 9 3.05859L15 3.05859Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px58.propTypes = {
  color: PropTypes.string,
};
