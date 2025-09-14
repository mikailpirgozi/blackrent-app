/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { LogoAutaJaguarV2100 } from "../../icons/LogoAutaJaguarV2100";
import { LogoAutaNissan100 } from "../../icons/LogoAutaNissan100";

interface Props {
  logoAuta:
    | "mercedes-100"
    | "chevrolet-100"
    | "porsche-100"
    | "volkswagen-100"
    | "jaguar-v2-100"
    | "ford-100"
    | "audi-100"
    | "dodge-100"
    | "hyundai-100"
    | "iveco-100"
    | "BMW-100"
    | "opel-100"
    | "tesla-100"
    | "nissan-100"
    | "mustang-100"
    | "skoda-100";
  logoAutaAudiClassName: any;
  logoAutaAudi: string;
  logoAutaChevrolet: string;
}

export const LogaAut2 = ({
  logoAuta,
  logoAutaAudiClassName,
  logoAutaAudi = "/img/logo-auta-audi-100-1.png",
  logoAutaChevrolet = "/img/logo-auta-chevrolet-100-1.png",
}: Props): JSX.Element => {
  return (
    <>
      {(logoAuta === "BMW-100" ||
        logoAuta === "audi-100" ||
        logoAuta === "chevrolet-100" ||
        logoAuta === "dodge-100" ||
        logoAuta === "ford-100" ||
        logoAuta === "hyundai-100" ||
        logoAuta === "iveco-100" ||
        logoAuta === "mercedes-100" ||
        logoAuta === "mustang-100" ||
        logoAuta === "opel-100" ||
        logoAuta === "porsche-100" ||
        logoAuta === "skoda-100" ||
        logoAuta === "tesla-100" ||
        logoAuta === "volkswagen-100") && (
        <img
          className={`w-[100px] left-0 top-0 h-[100px] absolute ${logoAutaAudiClassName}`}
          alt="Logo auta audi"
          src={
            logoAuta === "BMW-100"
              ? "/img/logo-auta-bmw-100-1.png"
              : logoAuta === "chevrolet-100"
                ? logoAutaChevrolet
                : logoAuta === "dodge-100"
                  ? "/img/logo-auta-dodge-100-1.png"
                  : logoAuta === "ford-100"
                    ? "/img/logo-auta-ford-100.png"
                    : logoAuta === "hyundai-100"
                      ? "/img/logo-auta-hyundai-100-1.png"
                      : logoAuta === "iveco-100"
                        ? "/img/logo-auta-iveco-100.png"
                        : logoAuta === "mercedes-100"
                          ? "/img/logo-auta-mercedes-100-1.png"
                          : logoAuta === "mustang-100"
                            ? "/img/logo-auta-mustang-100-1.png"
                            : logoAuta === "opel-100"
                              ? "/img/logo-auta-opel-100-1.png"
                              : logoAuta === "porsche-100"
                                ? "/img/logo-auta-porsche-100.png"
                                : logoAuta === "skoda-100"
                                  ? "/img/logo-auta-skoda-100-1.png"
                                  : logoAuta === "tesla-100"
                                    ? "/img/logo-auta-tesla-100-1.png"
                                    : logoAuta === "volkswagen-100"
                                      ? "/img/logo-auta-volkswagen-100-1.png"
                                      : logoAutaAudi
          }
        />
      )}

      {logoAuta === "jaguar-v2-100" && (
        <LogoAutaJaguarV2100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "nissan-100" && (
        <LogoAutaNissan100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}
    </>
  );
};

LogaAut2.propTypes = {
  logoAuta: PropTypes.oneOf([
    "mercedes-100",
    "chevrolet-100",
    "porsche-100",
    "volkswagen-100",
    "jaguar-v2-100",
    "ford-100",
    "audi-100",
    "dodge-100",
    "hyundai-100",
    "iveco-100",
    "BMW-100",
    "opel-100",
    "tesla-100",
    "nissan-100",
    "mustang-100",
    "skoda-100",
  ]),
  logoAutaAudi: PropTypes.string,
  logoAutaChevrolet: PropTypes.string,
};
