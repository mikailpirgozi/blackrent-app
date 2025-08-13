/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { IconPxFilled } from "../IconPxFilled";

interface Props {
  className: any;
  iconPxFilledTypeArrowSmall?: string;
  iconPxFilledImg?: string;
  iconPxFilledTypeArrowSmall1?: string;
  iconPxFilledTypeArrowSmall2?: string;
  iconPxFilledTypeArrowSmall3?: string;
  iconPxFilledTypeArrowSmall4?: string;
  iconPxFilledTypeArrowSmall5?: string;
  iconPxFilledTypeArrowSmall6?: string;
}

export const Faq = ({
  className,
  iconPxFilledTypeArrowSmall = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledImg = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall1 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall2 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall3 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall4 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall5 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall6 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
}: Props): JSX.Element => {
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

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
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

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Do ktorých krajín môžem s vozidlom vycestovať?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg"
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Môžem cestovať aj do krajín mimo Európskej Únie?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledImg}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Ako môžem platiť za prenájom vozidla?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall1}
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

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall2}
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

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall3}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Ako mám postupovať keď viem, že budem meškať?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall4}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center gap-2 pl-4 pr-2 py-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Čo znamená jeden deň prenájmu?
            </p>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall5}
            />
          </div>
        </div>

        <div className="flex flex-col items-start justify-center pl-4 pr-2 py-4 self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg gap-2 relative">
          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px]">
              Čo ak dostanem pokutu?
            </div>

            <IconPxFilled
              className="!relative !left-[unset] !top-[unset]"
              type="arrow-small-down"
              typeArrowSmall={iconPxFilledTypeArrowSmall6}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
