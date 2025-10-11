/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { TypArrowTopRight } from "../../icons/TypArrowTopRight";
import { TypBag2 } from "../../icons/TypBag2";

interface Props {
  typ: "arrow-top-right" | "bag-2" | "quote-marks" | "arrow-right";
}

export const IconPx = ({ typ }: Props): JSX.Element => {
  return (
    <>
      {typ === "arrow-right" && (
        <TypArrowRight
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "arrow-top-right" && (
        <TypArrowTopRight
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "bag-2" && (
        <TypBag2 className="!absolute !w-4 !h-4 !top-0 !left-0" />
      )}

      {typ === "quote-marks" && (
        <Icon16Px34
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}
    </>
  );
};

IconPx.propTypes = {
  typ: PropTypes.oneOf([
    "arrow-top-right",
    "bag-2",
    "quote-marks",
    "arrow-right",
  ]),
};
