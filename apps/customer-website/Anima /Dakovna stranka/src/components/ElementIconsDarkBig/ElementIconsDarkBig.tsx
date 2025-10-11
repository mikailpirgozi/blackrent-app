/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "pin";
  overlapGroupClassName: any;
  vector: string;
  ellipse: string;
}

export const ElementIconsDarkBig = ({
  type,
  overlapGroupClassName,
  vector = "/img/vector-5.svg",
  ellipse = "/img/ellipse-79.svg",
}: Props): JSX.Element => {
  return (
    <div className="relative w-[78px] h-[88px]">
      <div
        className={`relative w-32 h-32 -top-10 -left-2.5 bg-[url(/img/ellipse-80.svg)] bg-[100%_100%] ${overlapGroupClassName}`}
      >
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
      </div>
    </div>
  );
};

ElementIconsDarkBig.propTypes = {
  type: PropTypes.oneOf(["pin"]),
  vector: PropTypes.string,
  ellipse: PropTypes.string,
};
