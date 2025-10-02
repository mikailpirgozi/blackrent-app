/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "check";
  overlapGroupClassName: any;
  ellipse: string;
  union: string;
}

export const ElementIconsDarkBig = ({
  type,
  overlapGroupClassName,
  ellipse = "/img/ellipse-1-2.svg",
  union = "/img/union-7.svg",
}: Props): JSX.Element => {
  return (
    <div className="relative w-[92px] h-[88px]">
      <div
        className={`relative w-[135px] h-[135px] -top-9 left-[-3px] bg-[url(/img/union-6.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
        <img
          className="absolute w-[88px] h-[88px] top-9 left-[3px]"
          alt="Ellipse"
          src={ellipse}
        />

        <img
          className="absolute w-[41px] h-[31px] top-[65px] left-[29px]"
          alt="Union"
          src={union}
        />
      </div>
    </div>
  );
};

ElementIconsDarkBig.propTypes = {
  type: PropTypes.oneOf(["check"]),
  ellipse: PropTypes.string,
  union: PropTypes.string,
};
