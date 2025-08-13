/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  typ:
    | "facebook"
    | "message"
    | "mobil"
    | "filter-1"
    | "menu"
    | "instagram"
    | "tik-tok";
  className: any;
  typFilter?: string;
  typMessage?: string;
  typFacebook?: string;
  typInstagram?: string;
  typTiktok?: string;
  typMobil?: string;
  typMenu?: string;
}

export const TypMenuWrapper = ({
  typ,
  className,
  typFilter = "https://c.animaapp.com/h23eak6p/img/typ-filter-1.svg",
  typMessage = "https://c.animaapp.com/h23eak6p/img/typ-message.svg",
  typFacebook = "https://c.animaapp.com/h23eak6p/img/typ-facebook.svg",
  typInstagram = "https://c.animaapp.com/h23eak6p/img/typ-instagram.svg",
  typTiktok = "https://c.animaapp.com/h23eak6p/img/typ-tiktok.svg",
  typMobil = "https://c.animaapp.com/h23eak6p/img/typ-mobil.svg",
  typMenu = "https://c.animaapp.com/h23eak6p/img/typ-menu.svg",
}: Props): JSX.Element => {
  return (
    <img
      className={`w-6 left-0 top-0 h-6 absolute ${className}`}
      alt="Typ menu"
      src={
        typ === "message"
          ? typMessage
          : typ === "mobil"
            ? typMobil
            : typ === "filter-1"
              ? typFilter
              : typ === "tik-tok"
                ? typTiktok
                : typ === "instagram"
                  ? typInstagram
                  : typ === "facebook"
                    ? typFacebook
                    : typMenu
      }
    />
  );
};
