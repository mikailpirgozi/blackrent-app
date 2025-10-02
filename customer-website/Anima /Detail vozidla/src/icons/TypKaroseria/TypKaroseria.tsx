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

export const TypKaroseria = ({
  color = "#BEBEC3",
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
        d="M7.725 5C7.36379 5 7.03066 5.19479 6.85351 5.50957L4.88928 9H19.1266L17.1963 5.51543C17.0201 5.19736 16.6852 5 16.3215 5H7.725ZM21.413 9L18.9458 4.54628C18.4172 3.59209 17.4124 3 16.3215 3H7.725C6.64138 3 5.64198 3.58437 5.11055 4.52872L2.59434 9H1C0.447715 9 0 9.44772 0 10C0 10.5523 0.447715 11 1 11H2V16.9815C1.99974 16.9946 1.99974 17.0076 2 17.0206V19C2 19.5523 2.44772 20 3 20C3.55228 20 4 19.5523 4 19V18.2198L7.60969 18.9417C7.80341 18.9805 8.00048 19 8.19804 19H15.802C15.9995 19 16.1966 18.9805 16.3903 18.9417L20 18.2198V19C20 19.5523 20.4477 20 21 20C21.5523 20 22 19.5523 22 19V17.0207C22.0003 17.0076 22.0003 16.9946 22 16.9815V11H23C23.5523 11 24 10.5523 24 10C24 9.44772 23.5523 9 23 9H21.413ZM20 11V13H17C16.4477 13 16 13.4477 16 14C16 14.5523 16.4477 15 17 15H20V16.1802L15.9981 16.9806C15.9335 16.9935 15.8678 17 15.802 17H8.19804C8.13219 17 8.0665 16.9935 8.00192 16.9806L4 16.1802V15L7 15C7.55229 15 8 14.5523 8 14C8 13.4477 7.55228 13 7 13L4 13V11H20Z"
        fill={color}
        fillRule="evenodd"
      />
    </svg>
  );
};

TypKaroseria.propTypes = {
  color: PropTypes.string,
};
