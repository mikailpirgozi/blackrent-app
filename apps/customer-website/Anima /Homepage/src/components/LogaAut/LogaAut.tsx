/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { LogaAut39 } from "../../icons/LogaAut39";
import { LogaAut40 } from "../../icons/LogaAut40";
import { LogaAut46 } from "../../icons/LogaAut46";
import { LogaAut68 } from "../../icons/LogaAut68";
import { LogaAut71 } from "../../icons/LogaAut71";
import { LogoAutaAudi100 } from "../../icons/LogoAutaAudi100";
import { LogoAutaBmw100 } from "../../icons/LogoAutaBmw100";
import { LogoAutaMercedes100 } from "../../icons/LogoAutaMercedes100";
import { LogoAutaMustang100 } from "../../icons/LogoAutaMustang100";
import { LogoAutaSkoda100 } from "../../icons/LogoAutaSkoda100";
import { LogoAutaVolkswagen100 } from "../../icons/LogoAutaVolkswagen100";

interface Props {
  logoAuta:
    | "mercedes-100"
    | "chevrolet-100"
    | "volkswagen-100"
    | "hyundai-100"
    | "audi-100"
    | "dodge-100"
    | "opel-100"
    | "BMW-100"
    | "tesla-100"
    | "mustang-100"
    | "skoda-100";
}

export const LogaAut = ({ logoAuta }: Props): JSX.Element => {
  return (
    <>
      {logoAuta === "BMW-100" && (
        <LogoAutaBmw100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "audi-100" && (
        <LogoAutaAudi100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "chevrolet-100" && (
        <LogaAut39 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "dodge-100" && (
        <LogaAut40 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "hyundai-100" && (
        <LogaAut68 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "mercedes-100" && (
        <LogoAutaMercedes100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "mustang-100" && (
        <LogoAutaMustang100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "opel-100" && (
        <LogaAut71
          className="!absolute !w-[100px] !h-[100px] !top-0 !left-0"
          color="#3C3C41"
        />
      )}

      {logoAuta === "skoda-100" && (
        <LogoAutaSkoda100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "tesla-100" && (
        <LogaAut46 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}

      {logoAuta === "volkswagen-100" && (
        <LogoAutaVolkswagen100 className="!absolute !w-[100px] !h-[100px] !top-0 !left-0" />
      )}
    </>
  );
};

LogaAut.propTypes = {
  logoAuta: PropTypes.oneOf([
    "mercedes-100",
    "chevrolet-100",
    "volkswagen-100",
    "hyundai-100",
    "audi-100",
    "dodge-100",
    "opel-100",
    "BMW-100",
    "tesla-100",
    "mustang-100",
    "skoda-100",
  ]),
};
