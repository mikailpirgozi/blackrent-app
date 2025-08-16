"use client";

/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import Link from "next/link";
import { useReducer } from "react";
import { TypArrowTopRightWrapper } from "../TypArrowTopRightWrapper";
import { Arrow32Icon } from "../Arrow32Icon";

interface Props {
  type: "tag-DPH" | "hover" | "tag-discount-DPH" | "default";
  className: any;
  nHAdVozidlaClassName?: any;
  typArrowTopRightWrapperTypArrowTopRight?: string;
  vehicleId?: string;
}

export const KartaVozidlaPonukaVozidiel1728 = ({
  type,
  className,
  nHAdVozidlaClassName,
  typArrowTopRightWrapperTypArrowTopRight = "/assets/misc/icon-32-px-12.svg",
  vehicleId = "ford-mustang",
}: Props): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, {
    type: type || "default",
    originalType: type || "default",
    isHovered: false,
  });

  return (
    <Link href={`/vozidla/${vehicleId}`}>
      <div
        className={`w-[308px] flex flex-col items-start gap-[23px] p-4 h-[392px] overflow-hidden rounded-3xl justify-around relative transition-all duration-200 hover:scale-105 cursor-pointer ${state.isHovered ? "bg-colors-black-600" : "bg-colors-black-400"} ${className}`}
        onMouseLeave={() => {
          dispatch("mouse_leave");
        }}
        onMouseEnter={() => {
          dispatch("mouse_enter");
        }}
      >
      <div className="w-full flex self-stretch flex-col items-start grow gap-6 flex-1 relative">
        <div
          className={`w-full self-stretch bg-cover h-56 rounded-lg bg-[50%_50%] relative ${["tag-DPH", "tag-discount-DPH"].includes(state.type) ? "flex" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(state.type) ? "items-start" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(state.type) ? "gap-1" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(state.type) ? "p-2" : ""} ${state.originalType === "default" && state.isHovered ? "bg-[url(/assets/misc/n-h-ad-vozidla-5@2x.png)]" : state.originalType === "default" ? "bg-[url(/assets/misc/n-h-ad-vozidla-4@2x.png)]" : "bg-[url(/assets/misc/n-h-ad-vozidla-39@2x.png)]"} ${["tag-DPH", "tag-discount-DPH"].includes(state.type) ? "overflow-hidden" : ""} ${nHAdVozidlaClassName}`}
        >
          {["tag-DPH", "tag-discount-DPH"].includes(state.type) && (
            <div
              className={`inline-flex items-center flex-[0_0_auto] px-3 py-2 h-6 rounded-[99px] justify-center relative ${state.type === "tag-DPH" ? "gap-1" : "gap-2"} ${state.type === "tag-DPH" ? "bg-colors-white-800" : "bg-colors-light-yellow-accent-100"}`}
            >
              <div
                className={`[font-family:'Poppins',Helvetica] w-fit mt-[-1.00px] tracking-[0] text-xs font-medium leading-6 whitespace-nowrap relative ${state.type === "tag-DPH" ? "text-colors-black-600" : "text-colors-dark-yellow-accent-100"}`}
              >
                {state.type === "tag-discount-DPH" && <>-25%</>}

                {state.type === "tag-DPH" && <>Možný odpočet DPH</>}
              </div>
            </div>
          )}

          {state.type === "tag-discount-DPH" && (
            <div className="gap-1 bg-colors-white-800 inline-flex h-6 items-center justify-center px-3 py-2 relative flex-[0_0_auto] rounded-[99px]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-black-600 text-xs tracking-[0] leading-6 whitespace-nowrap">
                Možný odpočet DPH
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex self-stretch flex-col items-start grow flex-1 pl-2 pr-0 py-0 justify-between relative">
          <div
            className={`w-full flex self-stretch flex-col items-start gap-4 relative ${state.originalType === "default" && !state.isHovered ? "flex-[0_0_auto]" : ""}`}
          >
            <div className="text-colors-light-yellow-accent-700 leading-6 [font-family:'SF_Pro-ExpandedSemibold',Helvetica] relative font-normal text-xl self-stretch tracking-[0] min-h-[24px] overflow-hidden text-ellipsis">
              Názov vozidla
            </div>

            <p
              className={`text-colors-ligh-gray-800 leading-6 [font-family:'Poppins',Helvetica] relative font-normal text-xs self-stretch tracking-[0] overflow-hidden text-ellipsis min-h-[18px]`}
            >
              118 kW ∙ Benzín ∙ Manuál ∙ Predný náhon
            </p>
          </div>

          <div className="w-full flex self-stretch items-start flex-[0_0_auto] justify-between relative">
            <div className="flex items-end grow gap-2 flex-1 pl-0 pr-2 pt-0 pb-4 h-12 relative">
              <div className="[font-family:'Poppins',Helvetica] tracking-[0] text-base flex-1 text-colors-ligh-gray-200 font-normal leading-6 relative">
                {state.type === "tag-discount-DPH" ? (
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
              className={`w-12 flex items-center gap-2 px-3 py-3 h-12 overflow-hidden rounded-[99px] justify-center relative transition-all duration-200 hover:scale-110 group ${state.isHovered ? "bg-colors-dark-yellow-accent-200" : "bg-colors-black-600"}`}
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

function reducer(state: any, action: any) {
  switch (action) {
    case "mouse_enter":
      return {
        ...state,
        isHovered: true,
        type: state.originalType === "default" ? "hover" : state.originalType,
      };

    case "mouse_leave":
      return {
        ...state,
        isHovered: false,
        type: state.originalType,
      };
  }

  return state;
}
