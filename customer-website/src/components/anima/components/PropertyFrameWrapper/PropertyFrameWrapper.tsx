/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPxFilled } from "../IconPxFilled";

interface Props {
  property1?: "frame-375";
  className: any;
}

export const PropertyFrameWrapper = ({
  property1,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[1728px] items-center gap-2 pt-[200px] pb-60 px-2 relative bg-colors-black-300 rounded-[40px_40px_0px_0px] overflow-hidden ${className}`}
    >
      <div className="inline-flex flex-col items-center gap-[120px] relative flex-[0_0_auto]">
        <div className="relative w-[300px] h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[40px] text-center tracking-[0] leading-6 whitespace-nowrap">
          Časté otázky
        </div>

        <div className="inline-flex items-start gap-8 relative flex-[0_0_auto]">
          <div className="flex flex-col w-[567px] items-start gap-4 relative">
            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Čo je zahrnuté v cene prenájmu?
                  </p>
                </div>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    V akom stave je vozidlo pri odovzdaní nájomcovi?
                  </p>
                </div>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Do ktorých krajín môžem s vozidlom vycestovať?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Môžem cestovať aj do krajín mimo Európskej Únie?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Ako môžem platiť za prenájom vozidla?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col w-[567px] items-start gap-4 relative">
            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Majú vozidlá diaľničnú známku?
                  </div>
                </div>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Je možná preprava zvierat?
                  </div>
                </div>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Ako mám postupovať keď viem, že budem meškať?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čo znamená jeden deň prenájmu?
                </p>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čo ak dostanem pokutu?
                </div>

                <IconPxFilled
                  className="!relative !left-[unset] !top-[unset]"
                  type="arrow-small-down"
                  typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
