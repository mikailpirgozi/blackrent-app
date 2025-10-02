/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px14 } from "../../icons/Icon24Px14";

interface Props {
  state: "default";
  className: any;
}

export const FilterMobileButton = ({
  state,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[328px] h-[72px] items-center justify-center gap-2 px-6 py-4 relative bg-colors-black-600 rounded-2xl ${className}`}
    >
      <Icon24Px14 className="!relative !w-6 !h-6" color="#E4FF56" />
      <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
        Filtrácia
      </div>
    </div>
  );
};

FilterMobileButton.propTypes = {
  state: PropTypes.oneOf(["default"]),
};
