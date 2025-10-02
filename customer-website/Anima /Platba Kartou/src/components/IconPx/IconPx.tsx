/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px27 } from "../../icons/Icon24Px27";
import { Icon24Px52 } from "../../icons/Icon24Px52";
import { Icon24Px63 } from "../../icons/Icon24Px63";
import { Icon24Px65 } from "../../icons/Icon24Px65";
import { Icon24Px68 } from "../../icons/Icon24Px68";
import { Icon24Px69 } from "../../icons/Icon24Px69";
import { Icon24Px137 } from "../../icons/Icon24Px137";
import { Icon24Px138 } from "../../icons/Icon24Px138";
import { TypAnotherDriver } from "../../icons/TypAnotherDriver";
import { TypBike } from "../../icons/TypBike";
import { TypKidCarSeat } from "../../icons/TypKidCarSeat";

interface Props {
  typ:
    | "facebook"
    | "message"
    | "mobil"
    | "another-driver"
    | "menu"
    | "arrow-right"
    | "instagram"
    | "plus-2"
    | "kid-car-seat"
    | "bike"
    | "tik-tok";
}

export const IconPx = ({ typ }: Props): JSX.Element => {
  return (
    <>
      {typ === "arrow-right" && (
        <Icon24Px69
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "plus-2" && (
        <Icon24Px27
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "menu" && (
        <Icon24Px52
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "message" && (
        <Icon24Px65
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0FF98"
        />
      )}

      {typ === "mobil" && (
        <Icon24Px63
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "tik-tok" && (
        <Icon24Px68
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "instagram" && (
        <Icon24Px138
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "facebook" && (
        <Icon24Px137
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "another-driver" && (
        <TypAnotherDriver
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "kid-car-seat" && (
        <TypKidCarSeat
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "bike" && (
        <TypBike
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}
    </>
  );
};

IconPx.propTypes = {
  typ: PropTypes.oneOf([
    "facebook",
    "message",
    "mobil",
    "another-driver",
    "menu",
    "arrow-right",
    "instagram",
    "plus-2",
    "kid-car-seat",
    "bike",
    "tik-tok",
  ]),
};
