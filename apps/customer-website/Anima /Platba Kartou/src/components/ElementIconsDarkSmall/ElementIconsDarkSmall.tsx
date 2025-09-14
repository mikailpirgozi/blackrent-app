/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px4 } from "../../icons/Icon16Px4";

interface Props {
  type: "three-selected" | "four-disabled" | "check-selected";
  className: any;
  divClassName: any;
}

export const ElementIconsDarkSmall = ({
  type,
  className,
  divClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`w-10 bg-[100%_100%] h-10 relative ${type === "three-selected" ? "bg-[url(/img/ellipse-1.svg)]" : (type === "four-disabled") ? "bg-[url(/img/ellipse-1-1.svg)]" : "bg-[url(/img/ellipse-2.svg)]"} ${className}`}
    >
      {type === "check-selected" && (
        <Icon16Px4
          className="!absolute !w-4 !h-4 !top-3 !left-3"
          color="#E4FF56"
        />
      )}

      {["four-disabled", "three-selected"].includes(type) && (
        <div
          className={`[font-family:'SF_Pro-ExpandedRegular',Helvetica] left-[13px] tracking-[0] text-base top-3.5 h-[11px] font-normal text-center whitespace-nowrap leading-6 absolute ${type === "four-disabled" ? "text-colors-dark-gray-900" : "text-colors-ligh-gray-800"} ${divClassName}`}
        >
          {type === "three-selected" && <>3</>}

          {type === "four-disabled" && <>4</>}
        </div>
      )}
    </div>
  );
};

ElementIconsDarkSmall.propTypes = {
  type: PropTypes.oneOf(["three-selected", "four-disabled", "check-selected"]),
};
