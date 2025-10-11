/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { LogaAut32 } from "../../icons/LogaAut32";
import { LogaAut37 } from "../../icons/LogaAut37";
import { LogaAut39 } from "../../icons/LogaAut39";
import { LogaAut40 } from "../../icons/LogaAut40";
import { LogaAut46 } from "../../icons/LogaAut46";
import { LogaAut48 } from "../../icons/LogaAut48";
import { LogaAut49 } from "../../icons/LogaAut49";
import { LogaAut65 } from "../../icons/LogaAut65";
import { LogaAut68 } from "../../icons/LogaAut68";
import { LogaAut71 } from "../../icons/LogaAut71";
import { LogoAutaMercedes100 } from "../../icons/LogoAutaMercedes100";
import { LogoAutaSkoda100 } from "../../icons/LogoAutaSkoda100";
import { LogoAutaVolkswagen100 } from "../../icons/LogoAutaVolkswagen100";

interface Props {
  className: any;
  icon: JSX.Element;
  override: JSX.Element;
  icon1: JSX.Element;
  icon2: JSX.Element;
  icon3: JSX.Element;
  gradientZPravaClassName: any;
}

export const LogaAutAnimationWrapper = ({
  className,
  icon = (
    <LogaAut32 className="!w-[100px] !relative !h-[100px]" color="#3C3C41" />
  ),
  override = <LogoAutaSkoda100 className="!w-[100px] !relative !h-[100px]" />,
  icon1 = <LogoAutaVolkswagen100 className="!w-[100px] !relative !h-[100px]" />,
  icon2 = <LogaAut48 className="!w-[100px] !relative !h-[100px]" />,
  icon3 = <LogaAut49 className="!w-[26px] !relative !h-[100px]" />,
  gradientZPravaClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[1728px] h-[104px] items-center gap-2 relative ${className}`}
    >
      <div className="flex w-[1728px] h-[100px] items-center justify-center gap-12 relative">
        <LogaAut37 className="!w-[26px] !relative !h-[100px]" />
        <LogaAut65 className="!w-[100px] !relative !h-[100px]" />
        <LogaAut39 className="!w-[100px] !relative !h-[100px]" />
        <LogaAut40 className="!w-[100px] !relative !h-[100px]" />
        <LogaAut68 className="!w-[100px] !relative !h-[100px]" />
        <LogoAutaMercedes100 className="!w-[100px] !relative !h-[100px]" />
        {icon}
        <LogaAut71
          className="!w-[100px] !relative !h-[100px]"
          color="#A0A0A5"
        />
        {override}
        <LogaAut46 className="!w-[100px] !relative !h-[100px]" />
        {icon1}
        {icon2}
        {icon3}
      </div>

      <div
        className={`absolute w-[168px] h-[100px] top-0.5 left-[1560px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(5,5,10,1)_100%)] bg-colors-black-100 ${gradientZPravaClassName}`}
      />

      <div className="absolute w-[168px] h-[100px] top-0.5 left-0 bg-[linear-gradient(90deg,rgba(5,5,10,1)_0%,rgba(0,0,0,0)_100%)] bg-colors-black-100" />
    </div>
  );
};
