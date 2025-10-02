/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px64 } from "../../icons/Icon16Px64";
import { Icon16Px75 } from "../../icons/Icon16Px75";
import { Icon16Px83 } from "../../icons/Icon16Px83";
import { Ikony25_5 } from "../../icons/Ikony25_5";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { TypCheck } from "../../icons/TypCheck";
import { TypNahon1 } from "../../icons/TypNahon1";
import { TypPalivo1 } from "../../icons/TypPalivo1";
import { TypPlus } from "../../icons/TypPlus";
import { TypShare } from "../../icons/TypShare";
import { TypVykon1 } from "../../icons/TypVykon1";

interface Props {
  typ:
    | "arrow-down"
    | "info"
    | "nahon"
    | "heart"
    | "inxo-1px"
    | "plus"
    | "arrow-right"
    | "prevodovka"
    | "vykon"
    | "check"
    | "share"
    | "palivo";
}

export const Icon16Px = ({ typ }: Props): JSX.Element => {
  return (
    <>
      {typ === "plus" && (
        <TypPlus
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "arrow-down" && (
        <img
          className="absolute w-5 h-5 top-0 left-0"
          alt="Typ arrow down"
          src="/assets/figma-assets/typ-arrow-down.pdf"
        />
      )}

      {typ === "arrow-right" && (
        <TypArrowRight
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "check" && (
        <TypCheck className="!absolute !w-4 !h-4 !top-0 !left-0" />
      )}

      {typ === "heart" && (
        <Icon16Px75
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "share" && (
        <TypShare
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "info" && (
        <Icon16Px83
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "inxo-1px" && (
        <Icon16Px64
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "palivo" && (
        <TypPalivo1 className="!absolute !w-4 !h-4 !top-0 !left-0" />
      )}

      {typ === "vykon" && (
        <TypVykon1 className="!absolute !w-4 !h-4 !top-0 !left-0" />
      )}

      {typ === "prevodovka" && (
        <Ikony25_5
          className="!absolute !w-4 !h-4 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "nahon" && (
        <TypNahon1 className="!absolute !w-4 !h-4 !top-0 !left-0" />
      )}
    </>
  );
};

Icon16Px.propTypes = {
  typ: PropTypes.oneOf([
    "arrow-down",
    "info",
    "nahon",
    "heart",
    "inxo-1px",
    "plus",
    "arrow-right",
    "prevodovka",
    "vykon",
    "check",
    "share",
    "palivo",
  ]),
};
