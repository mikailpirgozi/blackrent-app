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

export const Icon24Px73 = ({
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
        d="M17 4C17.5523 4 18 4.44772 18 5V16.5858L21.2929 13.2929C21.6834 12.9024 22.3166 12.9024 22.7071 13.2929C23.0976 13.6834 23.0976 14.3166 22.7071 14.7071L17.7071 19.7071C17.3166 20.0976 16.6834 20.0976 16.2929 19.7071L11.2929 14.7071C10.9024 14.3166 10.9024 13.6834 11.2929 13.2929C11.6834 12.9024 12.3166 12.9024 12.7071 13.2929L16 16.5858L16 5C16 4.44772 16.4477 4 17 4ZM7 4C7.26522 4 7.51957 4.10536 7.70711 4.29289L12.7071 9.2929C13.0976 9.68342 13.0976 10.3166 12.7071 10.7071C12.3166 11.0976 11.6834 11.0976 11.2929 10.7071L8 7.41422L8 19C8 19.5523 7.55229 20 7 20C6.44772 20 6 19.5523 6 19L6 7.41421L2.70711 10.7071C2.31658 11.0976 1.68342 11.0976 1.29289 10.7071C0.902369 10.3166 0.902369 9.68342 1.29289 9.29289L6.29289 4.29289C6.48043 4.10536 6.73478 4 7 4Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px73.propTypes = {
  color: PropTypes.string,
};
