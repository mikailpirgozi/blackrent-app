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

export const ElementIconsDarkMedium = ({
  type,
  overlapGroupClassName,
  ellipse = "/img/ellipse-1.svg",
  union = "/img/union-1.svg",
}: Props): JSX.Element => {
  return (
    <div className="relative w-[60px] h-[58px]">
      <div
        className={`relative w-[116px] h-[116px] top-[-38px] -left-4 bg-[url(/img/union.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
        <img
          className="absolute w-[58px] h-[58px] top-[38px] left-4"
          alt="Ellipse"
          src={ellipse}
        />

        <img
          className="absolute w-7 h-[21px] top-[57px] left-8"
          alt="Union"
          src={union}
        />
      </div>
    </div>
  );
};

ElementIconsDarkMedium.propTypes = {
  type: PropTypes.oneOf(["check"]),
  ellipse: PropTypes.string,
  union: PropTypes.string,
};
