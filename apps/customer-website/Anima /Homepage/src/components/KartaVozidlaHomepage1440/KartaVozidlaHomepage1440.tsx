/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon32Px18 } from "../../icons/Icon32Px18";

interface Props {
  type: "default";
  className: any;
  nHAdVozidlaClassName: any;
}

export const KartaVozidlaHomepage1440 = ({
  type,
  className,
  nHAdVozidlaClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[352px] h-[392px] items-start justify-around gap-3.5 p-4 relative bg-colors-black-400 rounded-3xl overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-start gap-6 relative flex-1 self-stretch w-full grow">
        <div
          className={`relative self-stretch w-full h-56 rounded-lg bg-[url(/img/n-h-ad-vozidla-4.png)] bg-cover bg-[50%_50%] ${nHAdVozidlaClassName}`}
        />

        <div className="flex flex-col items-start justify-between pl-2 pr-0 py-0 relative flex-1 self-stretch w-full grow">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl tracking-[0] leading-7 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:0] [-webkit-box-orient:vertical]">
              Názov vozidla
            </div>

            <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon
            </p>
          </div>

          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-16 items-end gap-2 pl-0 pr-2 pt-0 pb-4 relative flex-1 grow">
              <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6">
                <span className="font-semibold text-[#a0a0a5]">od</span>

                <span className="font-semibold text-[#a0a0a5] text-xl">
                  &nbsp;
                </span>

                <span className="font-semibold text-[#f0f0f5] text-2xl">
                  123€
                </span>

                <span className="text-[#a0a0a5] text-2xl">/deň</span>
              </p>
            </div>

            <div className="flex w-16 h-16 items-center justify-center gap-2 px-6 py-3 relative bg-colors-black-600 rounded-[999px] overflow-hidden">
              <Icon32Px18
                className="!relative !w-8 !h-8 !ml-[-8.00px] !mr-[-8.00px]"
                color="#BEBEC3"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

KartaVozidlaHomepage1440.propTypes = {
  type: PropTypes.oneOf(["default"]),
};
