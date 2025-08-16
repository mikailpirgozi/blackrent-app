/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px59 } from "../../icons/Icon24Px59";
import { BlackrentLogo } from "../BlackrentLogo";

interface Props {
  type: "default";
  className: any;
}

export const Menu = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[360px] h-16 items-center justify-between px-4 py-0 relative ${className}`}
    >
      <BlackrentLogo className="!h-5 bg-[url(/img/vector-8.svg)] !relative !w-[134.0px]" />
      <Icon24Px59 className="!relative !w-6 !h-6" color="#D7FF14" />
    </div>
  );
};

Menu.propTypes = {
  type: PropTypes.oneOf(["default"]),
};
