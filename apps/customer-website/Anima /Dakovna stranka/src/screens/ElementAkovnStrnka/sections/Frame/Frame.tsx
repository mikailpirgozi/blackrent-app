import React from "react";
import { BlackrentLogo } from "../../../../components/BlackrentLogo";
import { Icon16Px30 } from "../../../../icons/Icon16Px30";
import { Icon16Px31 } from "../../../../icons/Icon16Px31";
import { Icon16Px32 } from "../../../../icons/Icon16Px32";
import { Icon16Px33 } from "../../../../icons/Icon16Px33";
import { Icon24Px40 } from "../../../../icons/Icon24Px40";
import { Icon24Px73 } from "../../../../icons/Icon24Px73";
import { Ikony25_19 } from "../../../../icons/Ikony25_19";
import { Ikony25_21 } from "../../../../icons/Ikony25_21";
import { Ikony25_22 } from "../../../../icons/Ikony25_22";
import { Ikony25_23 } from "../../../../icons/Ikony25_23";
import { TypTime } from "../../../../icons/TypTime";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-start gap-6 pt-4 pb-6 px-4 absolute top-[416px] left-4 bg-colors-black-300 rounded-3xl">
      <div className="flex h-[296px] items-end justify-around gap-6 pt-6 pb-3 px-2 relative self-stretch w-full rounded-2xl overflow-hidden bg-[url(/img/frame-521-3.png)] bg-cover bg-[50%_50%] bg-colors-black-100">
        <div className="flex flex-col w-[264px] items-start gap-2 relative">
          <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-base tracking-[0] leading-5 whitespace-nowrap">
              Škoda Octavia combi
            </div>

            <div className="flex flex-wrap items-start justify-between gap-[8px_6px] relative self-stretch w-full flex-[0_0_auto]">
              <div className="inline-flex flex-wrap items-center gap-[0px_0px] relative flex-[0_0_auto]">
                <Icon16Px30 className="!relative !w-4 !h-4" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-[10px] tracking-[0] leading-6 whitespace-nowrap">
                  123 kW
                </div>
              </div>

              <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                <Icon16Px31 className="!relative !w-4 !h-4" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-[10px] tracking-[0] leading-6 whitespace-nowrap">
                  Benzín
                </div>
              </div>

              <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                <Icon16Px32 className="!relative !w-4 !h-4" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-[10px] tracking-[0] leading-6 whitespace-nowrap">
                  Automat
                </div>
              </div>

              <div className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]">
                <Icon16Px33 className="!relative !w-4 !h-4" />
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-[10px] tracking-[0] leading-6 whitespace-nowrap">
                  Predný
                </div>
              </div>
            </div>
          </div>

          <img
            className="self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] relative object-cover"
            alt="Line"
            src="/img/line-22.svg"
          />

          <div className="flex h-4 items-center gap-1.5 relative self-stretch w-full">
            <div className="inline-flex h-4 items-center gap-1.5 relative flex-[0_0_auto]">
              <BlackrentLogo className="!h-4 bg-[url(/img/vector-41.svg)] !relative !w-[104px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
        <div className="flex flex-col w-[296px] items-start gap-2 relative flex-[0_0_auto]">
          <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative w-[186px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Miesto vyzdvihnutia
                </div>

                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Ikony25_19
                className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px]"
                color="#A0A0A5"
              />
              <div className="flex items-center gap-1 relative flex-1 grow">
                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>

                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                  Bánska Bystrica
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Miesto vrátenia
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Ikony25_19
                className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                color="#A0A0A5"
              />
              <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                Bratislava
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[88px] items-start relative self-stretch w-full">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative w-[186px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Dátum a čas vyzdvihnutia
                </div>

                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-4 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <Ikony25_21 className="!relative !w-6 !h-6" color="#A0A0A5" />
                <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  8. 2024
                </div>
              </div>

              <img
                className="w-px h-[25px] mt-[-4.50px] mb-[-4.50px] relative object-cover"
                alt="Line"
                src="/img/line-3-7.svg"
              />

              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <TypTime className="!relative !w-6 !h-6" color="#A0A0A5" />
                <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  16:00
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[88px] items-start relative self-stretch w-full">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Dátum a čas vrátenia
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-4 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <Ikony25_21 className="!relative !w-6 !h-6" color="#A0A0A5" />
                <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  8. 2024
                </div>
              </div>

              <img
                className="w-px h-[25px] mt-[-4.50px] mb-[-4.50px] relative object-cover"
                alt="Line"
                src="/img/line-3-7.svg"
              />

              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <TypTime className="!relative !w-6 !h-6" color="#A0A0A5" />
                <div className="text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  12:00
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[88px] items-start relative self-stretch w-full">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Poistenie
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Ikony25_22
                className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                color="#A0A0A5"
              />
              <div className="flex items-center gap-1 relative flex-1 grow">
                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>

                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                  Základné
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[88px] items-start relative self-stretch w-full">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Ďalšie služby
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Icon24Px40
                className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                color="#A0A0A5"
              />
              <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                Ďalší vodič, detská autosedačka
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Depozit
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Icon24Px73
                className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                color="#A0A0A5"
              />
              <div className="flex items-center gap-1 relative flex-1 grow">
                <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>

                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                  Slovensko, Česko
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex h-10 items-center px-0 py-4 relative self-stretch w-full rounded-lg">
              <div className="flex items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
                <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
                  Počet povolených km
                </div>

                <div className="mt-[-1.00px] mr-[-1.00px] text-colors-ligh-gray-200 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6 whitespace-nowrap">
                  {""}
                </div>
              </div>
            </div>

            <div className="flex h-12 items-center gap-1.5 p-4 relative self-stretch w-full rounded-lg border border-solid border-colors-black-800">
              <Ikony25_23
                className="!mt-[-4.00px] !mb-[-4.00px] !relative !w-6 !h-6"
                color="#A0A0A5"
              />
              <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                230 km/deň
              </div>
            </div>
          </div>
        </div>

        <p className="relative w-[296px] [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-center tracking-[0] leading-[18px]">
          Pred vyzdvihnutím vozidla na vami zvolenej pobočke zavolajte 15 min.
          dopredu manažérovi vozového parku ktorý pripravaví všetko potrebné k
          odovzdaniu vozidla.
        </p>
      </div>
    </div>
  );
};
