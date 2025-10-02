/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px107 } from "../../icons/Icon24Px107";

interface Props {
  type: "three-selected" | "four-disabled" | "pin" | "check-selected";
  className: any;
  overlapGroupClassName: any;
  vector: string;
  ellipse: string;
}

export const ElementIconsDarkBig = ({
  type,
  className,
  overlapGroupClassName,
  vector = "/img/vector-10.svg",
  ellipse = "/img/ellipse-79.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`h-[88px] relative ${type === "pin" ? "w-[78px]" : "w-[88px]"} ${["check-selected", "four-disabled", "three-selected"].includes(type) ? "bg-[100%_100%]" : ""} ${type === "check-selected" ? "bg-[url(/img/ellipse-2-1.svg)]" : (type === "three-selected") ? "bg-[url(/img/ellipse-1-2.svg)]" : type === "four-disabled" ? "bg-[url(/img/ellipse-1-3.svg)]" : ""} ${className}`}
    >
      {type === "check-selected" && (
        <Icon24Px107
          className="!absolute !w-6 !h-6 !top-8 !left-8"
          color="#E4FF56"
        />
      )}

      {["four-disabled", "pin", "three-selected"].includes(type) && (
        <div
          className={`${type === "pin" ? "-top-10" : "top-[31px]"} ${type === "three-selected" ? "text-colors-ligh-gray-800" : (type === "four-disabled") ? "text-colors-dark-gray-900" : ""} ${type === "pin" ? "relative" : "absolute"} ${["four-disabled", "three-selected"].includes(type) ? "[font-family:'SF_Pro-ExpandedRegular',Helvetica]" : ""} ${["four-disabled", "three-selected"].includes(type) ? "leading-6" : ""} ${type === "pin" ? "w-32" : ""} ${["four-disabled", "three-selected"].includes(type) ? "font-normal" : ""} ${type === "pin" ? "bg-[url(/img/ellipse-80.svg)]" : ""} ${["four-disabled", "three-selected"].includes(type) ? "text-center" : ""} ${["four-disabled", "three-selected"].includes(type) ? "whitespace-nowrap" : ""} ${["four-disabled", "three-selected"].includes(type) ? "text-[32px]" : ""} ${type === "pin" ? "bg-[100%_100%]" : ""} ${type === "pin" ? "-left-2.5" : "left-8"} ${["four-disabled", "three-selected"].includes(type) ? "tracking-[0]" : ""} ${type === "pin" ? "h-32" : "h-[23px]"} ${overlapGroupClassName}`}
        >
          {type === "three-selected" && <>3</>}

          {type === "four-disabled" && <>4</>}

          {type === "pin" && (
            <>
              <img
                className="absolute w-[70px] h-[88px] top-10 left-2.5"
                alt="Vector"
                src={vector}
              />

              <img
                className="absolute w-6 h-6 top-[60px] left-[33px]"
                alt="Ellipse"
                src={ellipse}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
};

ElementIconsDarkBig.propTypes = {
  type: PropTypes.oneOf([
    "three-selected",
    "four-disabled",
    "pin",
    "check-selected",
  ]),
  vector: PropTypes.string,
  ellipse: PropTypes.string,
};
