/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px21 } from "../../icons/Icon24Px21";

interface Props {
  state: "default";
  className: any;
  icon: JSX.Element;
  divClassName: any;
  text: string;
}

export const TlacitkoFilterMenu = ({
  state,
  className,
  icon = <Icon24Px21 className="!relative !w-6 !h-6" color="#D7FF14" />,
  divClassName,
  text = "Dátum vyzdvihnutia",
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[232px] h-14 items-center gap-2 px-4 py-2 relative bg-colors-black-600 rounded-lg ${className}`}
    >
      {icon}
      <div
        className={`relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] ${divClassName}`}
      >
        {text}
      </div>
    </div>
  );
};

TlacitkoFilterMenu.propTypes = {
  state: PropTypes.oneOf(["default"]),
  text: PropTypes.string,
};
