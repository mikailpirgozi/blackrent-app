/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px52 } from "../../icons/Icon24Px52";
import { BlackrentLogo } from "../BlackrentLogo";

interface Props {
  type: "default";
  className: any;
}

export const TypeDefaultWrapper = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[744px] h-16 items-center justify-between px-8 py-0 relative ${className}`}
    >
      <BlackrentLogo className="!h-6 bg-[url(/img/vector-22.svg)] !relative !w-[160.8px]" />
      <Icon24Px52 className="!relative !w-6 !h-6" color="#D7FF14" />
    </div>
  );
};

TypeDefaultWrapper.propTypes = {
  type: PropTypes.oneOf(["default"]),
};
