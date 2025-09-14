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

export const Icon24Px123 = ({
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
        d="M7.15184 2.51298C7.33458 2.22059 7.65505 2.04297 7.99985 2.04297H20C20.5523 2.04297 21 2.49068 21 3.04297V21.043C21 21.5953 20.5523 22.043 20 22.043H3C2.44772 22.043 2 21.5953 2 21.043V11.043C2 10.8556 2.05267 10.6719 2.15199 10.513L7.15184 2.51298ZM8.55411 4.04297L4.80422 10.043L19 10.043V4.04297H8.55411ZM19 12.043L4 12.043V20.043H19V12.043ZM12.9998 16.043C12.9998 15.4907 13.4476 15.043 13.9998 15.043H15.9998C16.5521 15.043 16.9998 15.4907 16.9998 16.043C16.9998 16.5953 16.5521 17.043 15.9998 17.043H13.9998C13.4476 17.043 12.9998 16.5953 12.9998 16.043Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

Icon24Px123.propTypes = {
  color: PropTypes.string,
};
