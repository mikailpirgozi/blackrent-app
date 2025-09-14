/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import Link from "next/link";
import { TypArrowTopRightWrapper } from "../TypArrowTopRightWrapper";
import { Arrow32Icon } from "../Arrow32Icon";

interface Props {
  property1?: "default";
  type?: "tag-DPH" | "hover" | "tag-discount-DPH" | "default";
  className: any;
  nHAdVozidlaClassName?: any;
  typArrowTopRightWrapperTypArrowTopRight?: string;
  tlaTkoClassName?: any;
  vehicleId?: string;
}

export const KartaVozidlaPonuka = ({
  property1,
  type = "default",
  className,
  nHAdVozidlaClassName,
  typArrowTopRightWrapperTypArrowTopRight = "/assets/misc/icon-32-px-12.svg",
  tlaTkoClassName,
  vehicleId = "bmw-x5",
}: Props): JSX.Element => {
  return (
    <Link href={`/vozidla/${vehicleId}`}>
      <div
        className={`flex flex-col w-64 h-[312px] items-start justify-around gap-[23px] p-4 relative bg-colors-black-400 rounded-3xl overflow-hidden transition-all duration-200 hover:scale-105 hover:bg-colors-black-600 cursor-pointer ${className}`}
      >
      <div className="flex flex-col items-start gap-4 relative flex-1 self-stretch w-full grow">
        <div
          className={`relative self-stretch w-full h-40 rounded-lg bg-cover bg-[50%_50%] ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "flex" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "items-start" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "gap-1" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "p-2" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "bg-[url(/assets/misc/n-h-ad-vozidla-39@2x.png)]" : "bg-[url(/assets/misc/n-h-ad-vozidla-12@2x.png)]"} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "overflow-hidden" : ""} ${nHAdVozidlaClassName}`}
        >
          {["tag-DPH", "tag-discount-DPH"].includes(type) && (
            <div
              className={`inline-flex items-center flex-[0_0_auto] px-3 py-2 h-6 rounded-[99px] justify-center relative ${type === "tag-DPH" ? "gap-1" : "gap-2"} ${type === "tag-DPH" ? "bg-colors-white-800" : "bg-colors-light-yellow-accent-100"}`}
            >
              <div
                className={`[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-xs font-medium leading-6 whitespace-nowrap relative ${type === "tag-DPH" ? "text-colors-black-600" : "text-colors-dark-yellow-accent-100"}`}
              >
                {type === "tag-discount-DPH" && <>-25%</>}
                {type === "tag-DPH" && <>Možný odpočet DPH</>}
              </div>
            </div>
          )}

          {type === "tag-discount-DPH" && (
            <div className="gap-1 bg-colors-white-800 inline-flex h-6 items-center justify-center px-3 py-2 relative flex-[0_0_auto] rounded-[99px]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-black-600 text-xs tracking-[0] leading-6 whitespace-nowrap">
                Možný odpočet DPH
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start justify-between relative flex-1 self-stretch w-full grow">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch min-h-[24px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 overflow-hidden text-ellipsis">
              Názov vozidla
            </div>

            <p className="relative self-stretch min-h-[18px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-4 overflow-hidden text-ellipsis">
              118 kW ∙ Diesel ∙ Automat ∙ Predný náhon
            </p>
          </div>

          <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-12 items-end gap-2 pl-0 pr-2 pt-0 pb-4 relative flex-1 grow">
              <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-ligh-gray-200 font-normal leading-6 relative">
                {type === "tag-discount-DPH" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#a0a0a5] font-semibold text-base">od</span>
                    <span className="font-semibold text-[#646469] text-xl line-through">123€</span>
                    <span className="text-[#d7ff14] font-semibold text-xl">89€</span>
                    <span className="text-[#a0a0a5] text-xl">/deň</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#a0a0a5] font-semibold text-base">od</span>
                    <span className="text-[#f0f0f5] font-semibold text-xl">123€</span>
                    <span className="text-[#a0a0a5] text-xl">/deň</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`flex w-12 h-12 items-center justify-center gap-2 px-3 py-3 relative bg-colors-black-600 rounded-[99px] overflow-hidden transition-all duration-200 hover:scale-110 group ${tlaTkoClassName}`}
            >
              <Arrow32Icon />
            </div>
          </div>
        </div>
      </div>
      </div>
    </Link>
  );
};
