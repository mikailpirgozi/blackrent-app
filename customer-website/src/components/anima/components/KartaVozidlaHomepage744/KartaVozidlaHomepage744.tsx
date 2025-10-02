"use client";

/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import Link from "next/link";
import { TypArrowTopRightWrapper } from "../TypArrowTopRightWrapper";
import { Arrow32Icon } from "../Arrow32Icon";

interface Props {
  type: "tag-DPH" | "hover" | "tag-discount-DPH" | "default";
  nHAdVozidlaClassName?: any;
  typArrowTopRightWrapperTypArrowTopRight?: string;
  vehicleId?: string;
}

export const KartaVozidlaHomepage744 = ({
  type,
  nHAdVozidlaClassName,
  typArrowTopRightWrapperTypArrowTopRight = "/assets/misc/icon-32-px-12.svg",
  vehicleId = "vozidlo-default",
}: Props): JSX.Element => {
  return (
    <Link href={`/vozidla/${vehicleId}`}>
      <div
        className={`w-[332px] flex flex-col items-start gap-[23px] p-4 h-[392px] overflow-hidden rounded-3xl justify-around relative transition-all duration-200 hover:scale-105 cursor-pointer ${type === "hover" ? "bg-colors-black-600" : "bg-colors-black-400 hover:bg-colors-black-600"}`}
      >
      <div className="w-full flex self-stretch flex-col items-start grow gap-6 flex-1 relative">
        <div
          className={`w-full self-stretch bg-cover h-56 rounded-lg bg-[50%_50%] relative ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "flex" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "items-start" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "gap-1" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "p-2" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "bg-[url(/assets/misc/n-h-ad-vozidla-39@2x.png)]" : "bg-[url(/assets/misc/n-h-ad-vozidla-9@2x.png)]"} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "overflow-hidden" : ""} ${nHAdVozidlaClassName}`}
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

        <div className="w-full flex self-stretch flex-col items-start grow flex-1 pl-2 pr-0 py-0 justify-between relative">
          <div className="w-full flex self-stretch flex-col items-start gap-4 flex-[0_0_auto] relative">
            <div className="text-colors-light-yellow-accent-700 leading-7 [font-family:'SF_Pro-ExpandedSemibold',Helvetica] relative font-normal text-2xl self-stretch tracking-[0] min-h-[28px] overflow-hidden text-ellipsis">
              Názov vozidla
            </div>

            <p className="[font-family:'Poppins',Helvetica] self-stretch tracking-[0] text-xs text-colors-ligh-gray-800 font-normal overflow-hidden text-ellipsis leading-4 min-h-[16px] relative">
              118 kW ∙ Diesel ∙ Automat ∙ Predný náhon
            </p>
          </div>

          <div className="w-full flex self-stretch items-center flex-[0_0_auto] justify-between relative">
            <div className="flex flex-col items-start grow gap-2 flex-1 pl-0 pr-2 pt-0 pb-4 h-12 justify-end relative">
              <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-ligh-gray-200 font-normal leading-6 relative">
                {type === "tag-discount-DPH" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#a0a0a5] font-semibold text-base">od</span>
                    <span className="font-semibold text-[#646469] text-2xl line-through">123€</span>
                    <span className="text-[#d7ff14] font-semibold text-2xl">89€</span>
                    <span className="text-[#a0a0a5] text-2xl">/deň</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#a0a0a5] font-semibold text-base">od</span>
                    <span className="text-[#f0f0f5] font-semibold text-2xl">123€</span>
                    <span className="text-[#a0a0a5] text-2xl">/deň</span>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`w-12 flex items-center gap-2 px-3 py-3 h-12 overflow-hidden rounded-[99px] justify-center relative transition-all duration-200 hover:scale-110 group ${type === "hover" ? "bg-colors-dark-yellow-accent-200" : "bg-colors-black-600"}`}
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
