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

export const Icon24Px81 = ({
  color = "#E4FF56",
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
        clipRule="evenodd"
        d="M12.0001 2.04297C12.5524 2.04297 13.0001 2.49068 13.0001 3.04297V7.04297C13.0001 7.59525 12.5524 8.04297 12.0001 8.04297C11.4478 8.04297 11.0001 7.59525 11.0001 7.04297V3.04297C11.0001 2.49068 11.4478 2.04297 12.0001 2.04297ZM18.8897 2.04922C19.4386 1.98823 19.933 2.38377 19.994 2.93268L21.994 20.9328C22.055 21.4817 21.6594 21.9761 21.1105 22.0371C20.5616 22.0981 20.0672 21.7026 20.0062 21.1537L18.0062 3.15354C17.9452 2.60463 18.3408 2.11021 18.8897 2.04922ZM5.11052 2.04936C5.65943 2.11035 6.05496 2.60477 5.99397 3.15367L3.99397 21.1537C3.93298 21.7026 3.43856 22.0981 2.88966 22.0371C2.34075 21.9761 1.94521 21.4817 2.0062 20.9328L4.0062 2.93281C4.06719 2.38391 4.56161 1.98837 5.11052 2.04936ZM12.0001 12.0431C12.5524 12.0431 13.0001 12.4908 13.0001 13.0431V17.0431C13.0001 17.5954 12.5524 18.0431 12.0001 18.0431C11.4478 18.0431 11.0001 17.5954 11.0001 17.0431V13.0431C11.0001 12.4908 11.4478 12.0431 12.0001 12.0431Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px81.propTypes = {
  color: PropTypes.string,
};
