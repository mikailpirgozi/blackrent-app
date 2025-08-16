/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { TypeArrowSmallDown } from "../../icons/TypeArrowSmallDown";

interface Props {
  className: any;
}

export const Faq = ({ className }: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[360px] items-center gap-10 px-4 py-20 relative bg-colors-black-300 rounded-[24px_24px_0px_0px] overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-[108px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl text-center tracking-[0] leading-6 whitespace-nowrap">
            Časté otázky
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="inline-flex items-center flex-[0_0_auto] gap-2 relative">
              <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                Čo je zahrnuté v cene prenájmu?
              </p>
            </div>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center flex-1 grow gap-2 relative">
              <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
                V akom stave je vozidlo pri odovzdaní nájomcovi?
              </p>
            </div>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Do ktorých krajín môžem s vozidlom vycestovať?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Môžem cestovať aj do krajín mimo Európskej Únie?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Ako môžem platiť za prenájom vozidla?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center flex-1 grow gap-2 relative">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                Majú vozidlá diaľničnú známku?
              </div>
            </div>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-center flex-1 grow gap-2 relative">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px] whitespace-nowrap">
                Je možná preprava zvierat?
              </div>
            </div>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Ako mám postupovať keď viem, že budem meškať?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Čo znamená jeden deň prenájmu?
            </p>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center pl-4 pr-2 py-4 self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg gap-2 relative">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Čo ak dostanem pokutu?
            </div>

            <TypeArrowSmallDown
              className="!relative !w-6 !h-6"
              color="#D7FF14"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
