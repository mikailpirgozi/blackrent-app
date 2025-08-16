/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  className: any;
  overlapGroupClassName: any;
  ellipse: string;
  union: string;
}

export const ElementIkonyCheck = ({
  className,
  overlapGroupClassName,
  ellipse = "/img/ellipse-1-1.svg",
  union = "/img/union-3.svg",
}: Props): JSX.Element => {
  return (
    <div className={`w-[93px] h-[88px] ${className}`}>
      <div
        className={`relative w-[135px] h-[135px] -top-9 -left-0.5 bg-[url(/img/union-2.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
        <img
          className="absolute w-[88px] h-[88px] top-9 left-0.5"
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

ElementIkonyCheck.propTypes = {
  ellipse: PropTypes.string,
  union: PropTypes.string,
};
