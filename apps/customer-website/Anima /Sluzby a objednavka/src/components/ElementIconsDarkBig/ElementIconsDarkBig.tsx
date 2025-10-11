/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px60 } from "../../icons/Icon24Px60";

interface Props {
  type: "four-selected" | "check-selected";
  className: any;
}

export const ElementIconsDarkBig = ({
  type,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`w-[88px] bg-[100%_100%] h-[88px] relative ${type === "four-selected" ? "bg-[url(/img/ellipse-1.svg)]" : "bg-[url(/img/ellipse-2-1.svg)]"} ${className}`}
    >
      {type === "check-selected" && (
        <Icon24Px60
          className="!absolute !w-6 !h-6 !top-8 !left-8"
          color="#E4FF56"
        />
      )}

      {type === "four-selected" && (
        <div className="absolute h-[23px] top-[31px] left-8 [font-family:'SF_Pro-ExpandedRegular',Helvetica] font-normal text-colors-ligh-gray-800 text-[32px] text-center tracking-[0] leading-6 whitespace-nowrap">
          4
        </div>
      )}
    </div>
  );
};

ElementIconsDarkBig.propTypes = {
  type: PropTypes.oneOf(["four-selected", "check-selected"]),
};
