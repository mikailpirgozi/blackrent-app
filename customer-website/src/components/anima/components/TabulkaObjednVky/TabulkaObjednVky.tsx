/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px44 } from "../../icons/Icon16Px44";
import { Icon16Px83 } from "../../icons/Icon16Px83";
import { TypPlus } from "../../icons/TypPlus";
import { CheckBoxy } from "../CheckBoxy";

interface Props {
  type: "default";
  className: any;
}

export const TabulkaObjednVky = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[328px] items-center gap-6 relative bg-colors-black-200 rounded-3xl overflow-hidden border border-solid border-colors-black-600 ${className}`}
    >
      <div className="flex-col items-start gap-6 px-4 py-6 flex-[0_0_auto] bg-colors-black-400 flex relative self-stretch w-full">
        <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-lg tracking-[0] leading-6 whitespace-nowrap">
          Prenájom vozidla
        </div>

        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex-col items-start gap-4 flex-[0_0_auto] flex relative self-stretch w-full">
            <div className="flex h-10 items-center gap-0.5 px-4 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Miesto vyzdvihnutia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex h-10 items-center gap-0.5 px-4 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Deň vyzdvihnutia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex h-10 items-center gap-0.5 px-4 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čas vyzdvihnutia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>

            <div className="h-10 items-center gap-0.5 px-4 py-3 bg-colors-black-600 rounded-lg flex relative self-stretch w-full">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Miesto vrátenia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>

            <div className="h-10 items-center gap-0.5 px-4 py-3 bg-colors-black-600 rounded-lg flex relative self-stretch w-full">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Deň vrátenia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex h-10 items-center gap-0.5 px-4 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
              <div className="h-[18px] gap-1 flex-1 grow mt-[-1.00px] mb-[-1.00px] flex items-center relative">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čas vrátenia:
                </div>

                <div className="flex-1 font-normal text-colors-ligh-gray-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <Icon16Px44 className="!relative !w-4 !h-4" />
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <div className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full rounded-lg">
                <div className="justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center relative">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    Počet povolených km
                  </div>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>

              <div className="flex flex-col h-8 items-start justify-around gap-2 p-4 relative self-stretch w-full rounded-lg">
                <div className="justify-between self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center relative">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    Cena prenájmu
                  </div>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>

              <div className="h-8 justify-around gap-2 p-4 rounded-lg flex items-center relative self-stretch w-full">
                <div className="justify-between flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center relative">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    <span className="font-semibold">Poistenie </span>

                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                      (základné)
                    </span>
                  </p>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-col h-10 items-start justify-center gap-4 p-4 bg-colors-black-600 flex relative self-stretch w-full rounded-lg">
              <div className="gap-1.5 flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px] flex items-center relative self-stretch w-full">
                <TypPlus className="!relative !w-4 !h-4" color="#D7FF14" />
                <div className="justify-between flex-1 grow flex items-center relative">
                  <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </div>

                  <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-green-accent-500 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
              <div className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full rounded-lg">
                <div className="justify-between pl-0 pr-4 py-0 flex-1 grow flex items-center relative">
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                      <span className="font-semibold">Depozit</span>

                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                        {" "}
                        (vratná záloha)
                      </span>
                    </p>

                    <Icon16Px83
                      className="!relative !w-4 !h-4"
                      color="#646469"
                    />
                  </div>

                  <div className="relative w-4 h-[11px]" />
                </div>
              </div>

              <div className="items-center justify-around gap-2 px-4 py-1 flex-[0_0_auto] flex relative self-stretch w-full rounded-lg">
                <div className="gap-2 flex-1 grow flex items-center relative">
                  <CheckBoxy stav="radio-selected" />
                  <div className="flex items-center gap-[151px] relative flex-1 grow">
                    <div className="relative w-[215px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                      Slovensko, Česko, Rakúsko
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around gap-2 px-4 py-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
                <div className="gap-2 flex-1 grow flex items-center relative">
                  <CheckBoxy stav="radio-default" />
                  <div className="flex items-center gap-[151px] relative flex-1 grow">
                    <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-5">
                      <span className="font-medium">
                        +Poľsko, Nemecko, Maďarsko{" "}
                      </span>

                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-5">
                        (+30% depozit)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around gap-2 px-4 py-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
                <div className="gap-2 flex-1 grow flex items-center relative">
                  <CheckBoxy stav="radio-default" />
                  <div className="flex items-center gap-[151px] relative flex-1 grow">
                    <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-5">
                      <span className="font-medium">
                        Celá EU okrem Rumunska{"  "}
                      </span>

                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-5">
                        (+60% depozit)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around gap-2 px-4 py-2 relative self-stretch w-full flex-[0_0_auto] rounded-lg">
                <div className="gap-2 flex-1 grow flex items-center relative">
                  <CheckBoxy stav="radio-default" />
                  <div className="flex items-center gap-[151px] relative flex-1 grow">
                    <p className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-5">
                      <span className="font-medium">Mimo EU </span>

                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-5">
                        (individuálne posúdenie – kontaktujte nás)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

TabulkaObjednVky.propTypes = {
  type: PropTypes.oneOf(["default"]),
};
