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

export const ElementIkonyMobil = ({
  className,
  overlapGroupClassName,
  ellipse = "/img/ellipse-1.svg",
  union = "/img/union.svg",
}: Props): JSX.Element => {
  return (
    <div className={`w-[57px] h-[54px] ${className}`}>
      <div
        className={`relative w-[114px] h-[114px] top-[-37px] left-[-17px] bg-[url(/img/rectangle-1001.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
        <img
          className="absolute w-[54px] h-[54px] top-[37px] left-[17px]"
          alt="Ellipse"
          src={ellipse}
        />

        <img
          className="absolute w-[26px] h-5 top-[53px] left-[33px]"
          alt="Union"
          src={union}
        />
      </div>
    </div>
  );
};

ElementIkonyMobil.propTypes = {
  ellipse: PropTypes.string,
  union: PropTypes.string,
};
