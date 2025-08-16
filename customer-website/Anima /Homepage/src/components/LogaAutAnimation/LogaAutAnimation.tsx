/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { LogaAut1 } from "../../icons/LogaAut1";
import { LogaAut6 } from "../../icons/LogaAut6";
import { LogaAut7 } from "../../icons/LogaAut7";
import { LogaAut10 } from "../../icons/LogaAut10";
import { LogaAut11 } from "../../icons/LogaAut11";
import { LogaAut39 } from "../../icons/LogaAut39";
import { LogaAut40 } from "../../icons/LogaAut40";
import { LogaAut46 } from "../../icons/LogaAut46";
import { LogaAut63 } from "../../icons/LogaAut63";
import { LogaAut68 } from "../../icons/LogaAut68";
import { LogoAutaMercedes100 } from "../../icons/LogoAutaMercedes100";

interface Props {
  logaAut: "default-mobil";
  className: any;
  icon: JSX.Element;
  override: JSX.Element;
  icon1: JSX.Element;
  icon2: JSX.Element;
  icon3: JSX.Element;
  icon4: JSX.Element;
  icon5: JSX.Element;
  icon6: JSX.Element;
  icon7: JSX.Element;
  gradientZPravaClassName: any;
}

export const LogaAutAnimation = ({
  logaAut,
  className,
  icon = <LogaAut68 className="!relative !w-[60px] !h-[60px]" />,
  override = <LogoAutaMercedes100 className="!relative !w-[60px] !h-[60px]" />,
  icon1 = <LogaAut6 className="!relative !w-[60px] !h-[60px]" />,
  icon2 = <LogaAut7 className="!relative !w-[60px] !h-[60px]" />,
  icon3 = <LogaAut63 className="!relative !w-[60px] !h-[60px]" />,
  icon4 = <LogaAut46 className="!relative !w-[60px] !h-[60px]" />,
  icon5 = <LogaAut10 className="!relative !w-[60px] !h-[60px]" />,
  icon6 = <LogaAut11 className="!relative !w-[60px] !h-[60px]" />,
  icon7 = <LogaAut39 className="!relative !w-[60px] !h-[60px]" />,
  gradientZPravaClassName,
}: Props): JSX.Element => {
  return (
    <div className={`flex w-[1068px] items-center gap-2 relative ${className}`}>
      <div className="flex w-[1068px] items-center justify-center gap-6 relative self-stretch">
        <LogaAut11 className="!relative !w-[60px] !h-[60px]" />
        <LogaAut1 className="!relative !w-[60px] !h-[60px]" />
        <LogaAut39 className="!relative !w-[60px] !h-[60px]" />
        <LogaAut40 className="!relative !w-[60px] !h-[60px]" />
        {icon}
        {override}
        {icon1}
        {icon2}
        {icon3}
        {icon4}
        {icon5}
        {icon6}
        {icon7}
      </div>

      <div
        className={`absolute w-10 h-[60px] top-0 left-[1028px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(5,5,10,1)_100%)] ${gradientZPravaClassName}`}
      />

      <div className="absolute w-10 h-[60px] top-0 left-0 bg-[linear-gradient(90deg,rgba(5,5,10,1)_0%,rgba(0,0,0,0)_100%)]" />
    </div>
  );
};

LogaAutAnimation.propTypes = {
  logaAut: PropTypes.oneOf(["default-mobil"]),
};
