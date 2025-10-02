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

export const Icon24Px124 = ({
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
        d="M13.4789 1.12229C13.9637 1.38676 14.1424 1.99419 13.8779 2.47904L8.90294 11.5998L16.8039 10.0196C17.1847 9.94344 17.5752 10.0947 17.8054 10.4075C18.0356 10.7203 18.0639 11.1381 17.8779 11.479L11.8779 22.479C11.6134 22.9639 11.006 23.1425 10.5212 22.8781C10.0363 22.6136 9.85765 22.0062 10.1221 21.5213L15.0971 12.4006L7.19612 13.9808C6.81528 14.0569 6.42479 13.9057 6.19459 13.5929C5.96439 13.2801 5.93613 12.8623 6.12211 12.5213L12.1221 1.52134C12.3866 1.03649 12.994 0.857831 13.4789 1.12229Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px124.propTypes = {
  color: PropTypes.string,
};
