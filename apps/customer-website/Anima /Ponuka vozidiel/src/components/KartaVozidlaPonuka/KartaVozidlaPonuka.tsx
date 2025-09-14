/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon32Px12 } from "../../icons/Icon32Px12";

interface Props {
  property1: "default";
  className: any;
  nHAdVozidlaClassName: any;
  icon: JSX.Element;
  tlaTkoClassName: any;
}

export const KartaVozidlaPonuka = ({
  property1,
  className,
  nHAdVozidlaClassName,
  icon = (
    <Icon32Px12
      className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
      color="#BEBEC3"
    />
  ),
  tlaTkoClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-64 h-[312px] items-start justify-around gap-[23px] p-4 relative bg-colors-black-400 rounded-3xl overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-start gap-4 relative flex-1 self-stretch w-full grow">
        <div
          className={`relative self-stretch w-full h-40 rounded-lg bg-[url(/img/n-h-ad-vozidla-8.png)] bg-cover bg-[50%_50%] ${nHAdVozidlaClassName}`}
        />

        <div className="flex flex-col items-start justify-between relative flex-1 self-stretch w-full grow">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:0] [-webkit-box-orient:vertical]">
              Názov vozidla
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-4 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              118 kW ∙ Diesel ∙ Automat ∙ Predný náh.
            </p>
          </div>

          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-12 items-end gap-2 pl-0 pr-2 pt-0 pb-4 relative flex-1 grow">
              <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-base tracking-[0] leading-6">
                <span className="font-semibold text-[#a0a0a5]">od</span>

                <span className="font-semibold text-[#a0a0a5] text-xl">
                  &nbsp;
                </span>

                <span className="font-semibold text-[#f0f0f5] text-xl">
                  123€
                </span>

                <span className="text-[#a0a0a5] text-xl">/deň</span>
              </p>
            </div>

            <div
              className={`flex w-12 h-12 items-center justify-center gap-2 px-6 py-3 relative bg-colors-black-600 rounded-[99px] overflow-hidden ${tlaTkoClassName}`}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

KartaVozidlaPonuka.propTypes = {
  property1: PropTypes.oneOf(["default"]),
};
