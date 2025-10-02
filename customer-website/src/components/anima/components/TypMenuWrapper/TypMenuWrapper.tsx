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
  typFilter = "/assets/misc/typ-filter-1.svg",
  typMessage = "/assets/misc/typ-message.svg",
  typFacebook = "/assets/misc/typ-facebook.svg",
  typInstagram = "/assets/misc/typ-instagram.svg",
  typTiktok = "/assets/misc/typ-tiktok.svg",
  typMobil = "/assets/misc/typ-mobil.svg",
  typMenu = "/assets/misc/typ-menu.svg",
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
