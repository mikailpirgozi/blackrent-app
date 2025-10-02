/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon32Px18 } from "../../icons/Icon32Px18";

interface Props {
  type: "tag-DPH" | "hover" | "tag-discount-DPH" | "default";
  nHAdVozidlaClassName: any;
  icon: JSX.Element;
}

export const KartaVozidlaHomepage744 = ({
  type,
  nHAdVozidlaClassName,
  icon = (
    <Icon32Px18
      className="!relative !w-8 !h-8 !mt-[-4.00px] !mb-[-4.00px] !ml-[-16.00px] !mr-[-16.00px]"
      color="#BEBEC3"
    />
  ),
}: Props): JSX.Element => {
  return (
    <div
      className={`w-[332px] flex flex-col items-start gap-[23px] p-4 h-[392px] overflow-hidden rounded-3xl justify-around relative ${type === "hover" ? "bg-colors-black-600" : "bg-colors-black-400"}`}
    >
      <div className="w-full flex self-stretch flex-col items-start grow gap-6 flex-1 relative">
        <div
          className={`w-full self-stretch bg-cover h-56 rounded-lg bg-[50%_50%] relative ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "flex" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "items-start" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "gap-1" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "p-2" : ""} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "bg-[url(/img/n-h-ad-vozidla-12.png)]" : "bg-[url(/img/n-h-ad-vozidla-10.png)]"} ${["tag-DPH", "tag-discount-DPH"].includes(type) ? "overflow-hidden" : ""} ${nHAdVozidlaClassName}`}
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
            <div className="[display:-webkit-box] mt-[-1.00px] [-webkit-line-clamp:0] text-colors-light-yellow-accent-700 [-webkit-box-orient:vertical] leading-7 [font-family:'SF_Pro-ExpandedSemibold',Helvetica] relative font-normal whitespace-nowrap text-2xl self-stretch tracking-[0] h-4 overflow-hidden text-ellipsis">
              Názov vozidla
            </div>

            <p className="[font-family:'Poppins',Helvetica] [display:-webkit-box] self-stretch tracking-[0] [-webkit-line-clamp:1] text-xs text-colors-ligh-gray-800 font-normal overflow-hidden [-webkit-box-orient:vertical] text-ellipsis leading-4 relative">
              118 kW ∙ Diesel ∙ Automat ∙ Predný náhon
            </p>
          </div>

          <div className="w-full flex self-stretch items-center flex-[0_0_auto] justify-between relative">
            <div className="flex flex-col items-start grow gap-2 flex-1 pl-0 pr-2 pt-0 pb-4 h-12 justify-end relative">
              <div className="[font-family:'Poppins',Helvetica] [display:-webkit-box] self-stretch tracking-[0] [-webkit-line-clamp:1] text-base text-colors-white-1000 font-normal overflow-hidden [-webkit-box-orient:vertical] text-ellipsis leading-6 relative">
                <span
                  className={`font-semibold ${type === "tag-discount-DPH" ? "text-[#d2d2d7]" : "text-[#a0a0a5]"}`}
                >
                  {type === "tag-discount-DPH" && <>od </>}

                  {["default", "hover", "tag-DPH"].includes(type) && <>od</>}
                </span>

                {type === "tag-discount-DPH" && (
                  <p>
                    <span className="font-semibold text-[#646469] text-2xl line-through">
                      123€
                    </span>
                  </p>
                )}

                <span
                  className={`font-semibold ${type === "tag-discount-DPH" ? "text-2xl" : "text-xl"} ${type === "tag-discount-DPH" ? "text-[#f0f0f5]" : "text-[#a0a0a5]"}`}
                >
                  &nbsp;
                </span>

                <span
                  className={`text-2xl font-semibold ${type === "tag-discount-DPH" ? "text-[#d7ff14]" : "text-[#f0f0f5]"}`}
                >
                  {["default", "hover", "tag-DPH"].includes(type) && <>123€</>}

                  {type === "tag-discount-DPH" && <>89€</>}
                </span>

                {type === "tag-discount-DPH" && (
                  <p>
                    <span className="font-medium text-[#a0a0a5] text-2xl">
                      /deň
                    </span>
                  </p>
                )}

                {["default", "hover", "tag-DPH"].includes(type) && (
                  <p>
                    <span className="text-2xl text-[#a0a0a5]">/deň</span>
                  </p>
                )}
              </div>
            </div>

            <div
              className={`w-12 flex items-center gap-2 px-6 py-3 h-12 overflow-hidden rounded-[99px] justify-center relative ${type === "hover" ? "bg-colors-dark-yellow-accent-200" : "bg-colors-black-600"}`}
            >
              {icon}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

KartaVozidlaHomepage744.propTypes = {
  type: PropTypes.oneOf(["tag-DPH", "hover", "tag-discount-DPH", "default"]),
};
