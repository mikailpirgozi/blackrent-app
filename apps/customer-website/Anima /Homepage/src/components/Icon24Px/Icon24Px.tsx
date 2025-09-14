/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px20 } from "../../icons/Icon24Px20";
import { Icon24Px21 } from "../../icons/Icon24Px21";
import { Icon24Px39 } from "../../icons/Icon24Px39";
import { Icon24Px58 } from "../../icons/Icon24Px58";
import { Icon24Px60 } from "../../icons/Icon24Px60";
import { Icon24Px63 } from "../../icons/Icon24Px63";
import { Icon24Px111 } from "../../icons/Icon24Px111";
import { TypFacebook } from "../../icons/TypFacebook";
import { TypInstagram } from "../../icons/TypInstagram";
import { TypSearch } from "../../icons/TypSearch";

interface Props {
  typ:
    | "facebook"
    | "message"
    | "pin"
    | "calendar"
    | "mobil"
    | "menu"
    | "arrow-right"
    | "instagram"
    | "search"
    | "tik-tok";
}

export const Icon24Px = ({ typ }: Props): JSX.Element => {
  return (
    <>
      {typ === "arrow-right" && (
        <Icon24Px111
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "menu" && (
        <Icon24Px39
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "pin" && (
        <Icon24Px20
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "message" && (
        <Icon24Px60
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0FF98"
        />
      )}

      {typ === "mobil" && (
        <Icon24Px58
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "calendar" && (
        <Icon24Px21
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0FF98"
        />
      )}

      {typ === "search" && (
        <TypSearch
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "tik-tok" && (
        <Icon24Px63
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "instagram" && (
        <TypInstagram
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "facebook" && (
        <TypFacebook
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}
    </>
  );
};

Icon24Px.propTypes = {
  typ: PropTypes.oneOf([
    "facebook",
    "message",
    "pin",
    "calendar",
    "mobil",
    "menu",
    "arrow-right",
    "instagram",
    "search",
    "tik-tok",
  ]),
};
