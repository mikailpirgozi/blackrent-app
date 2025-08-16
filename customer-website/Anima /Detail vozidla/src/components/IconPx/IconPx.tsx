/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px47 } from "../../icons/Icon24Px47";
import { Icon24Px48 } from "../../icons/Icon24Px48";
import { Icon24Px51 } from "../../icons/Icon24Px51";
import { Icon24Px63 } from "../../icons/Icon24Px63";
import { Icon24Px81 } from "../../icons/Icon24Px81";
import { Icon24Px94 } from "../../icons/Icon24Px94";
import { Icon24Px123 } from "../../icons/Icon24Px123";
import { Icon24Px124 } from "../../icons/Icon24Px124";
import { Icon24Px125 } from "../../icons/Icon24Px125";
import { Ikony25_4 } from "../../icons/Ikony25_4";
import { Ikony25_5 } from "../../icons/Ikony25_5";
import { Ikony25_7 } from "../../icons/Ikony25_7";
import { TypFacebook } from "../../icons/TypFacebook";
import { TypInstagram } from "../../icons/TypInstagram";
import { TypKaroseria } from "../../icons/TypKaroseria";
import { TypNahon } from "../../icons/TypNahon";
import { TypPhoto } from "../../icons/TypPhoto";

interface Props {
  typ:
    | "najazd-km"
    | "facebook"
    | "message"
    | "calendar"
    | "nahon"
    | "photo"
    | "mobil"
    | "spotreba"
    | "karoseria"
    | "menu"
    | "prevodovka"
    | "instagram"
    | "vykon"
    | "dvere"
    | "palivo"
    | "tik-tok"
    | "objem-valcov";
}

export const IconPx = ({ typ }: Props): JSX.Element => {
  return (
    <>
      {typ === "menu" && (
        <Icon24Px47
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0F0F5"
        />
      )}

      {typ === "message" && (
        <Icon24Px48
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

      {typ === "calendar" && (
        <Ikony25_7
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#F0FF98"
        />
      )}

      {typ === "photo" && (
        <TypPhoto className="!absolute !w-6 !h-6 !top-0 !left-0" />
      )}

      {typ === "tik-tok" && (
        <Icon24Px51
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

      {typ === "objem-valcov" && (
        <Icon24Px125
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "prevodovka" && (
        <Ikony25_5
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "najazd-km" && (
        <Icon24Px81
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "dvere" && (
        <Icon24Px123
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "palivo" && (
        <Ikony25_4
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "spotreba" && (
        <Icon24Px94
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "karoseria" && (
        <TypKaroseria
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#BEBEC3"
        />
      )}

      {typ === "nahon" && (
        <TypNahon
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}

      {typ === "vykon" && (
        <Icon24Px124
          className="!absolute !w-6 !h-6 !top-0 !left-0"
          color="#FAFAFF"
        />
      )}
    </>
  );
};

IconPx.propTypes = {
  typ: PropTypes.oneOf([
    "najazd-km",
    "facebook",
    "message",
    "calendar",
    "nahon",
    "photo",
    "mobil",
    "spotreba",
    "karoseria",
    "menu",
    "prevodovka",
    "instagram",
    "vykon",
    "dvere",
    "palivo",
    "tik-tok",
    "objem-valcov",
  ]),
};
