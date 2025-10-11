/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px4 } from "../../icons/Icon16Px4";
import { Icon16Px6 } from "../../icons/Icon16Px6";
import { Icon16Px65 } from "../../icons/Icon16Px65";
import { TypArrowRight } from "../../icons/TypArrowRight";

interface Props {
  typ: "arrow-right_1" | "arrow-top" | "arrow-down" | "cancel" | "arrow-right";
  typArrowDownClassName: any;
  typArrowDown: string;
}

export const IconPx = ({
  typ,
  typArrowDownClassName,
  typArrowDown = "/img/typ-arrow-down.pdf",
}: Props): JSX.Element => {
  return (
    <>
      {typ === "cancel" && (
        <Icon16Px65
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "arrow-top" && (
        <Icon16Px4
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "arrow-down" && (
        <img
          className={`absolute w-5 h-5 top-0 left-0 ${typArrowDownClassName}`}
          alt="Typ arrow down"
          src={typArrowDown}
        />
      )}

      {typ === "arrow-right" && (
        <TypArrowRight
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "arrow-right_1" && (
        <Icon16Px6
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}
    </>
  );
};

IconPx.propTypes = {
  typ: PropTypes.oneOf([
    "arrow-right_1",
    "arrow-top",
    "arrow-down",
    "cancel",
    "arrow-right",
  ]),
  typArrowDown: PropTypes.string,
};
