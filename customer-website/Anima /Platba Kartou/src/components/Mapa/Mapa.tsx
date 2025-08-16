/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24PxFilled } from "../../icons/Icon24PxFilled";

interface Props {
  property1: "a";
  className: any;
}

export const Mapa = ({ property1, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[1652px] h-[480px] items-center justify-center gap-2 relative rounded-2xl overflow-hidden ${className}`}
    >
      <Icon24PxFilled className="!relative !w-6 !h-6" color="#E4FF56" />
    </div>
  );
};

Mapa.propTypes = {
  property1: PropTypes.oneOf(["a"]),
};
