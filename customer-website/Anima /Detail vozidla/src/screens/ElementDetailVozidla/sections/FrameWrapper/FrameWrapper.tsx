import React from "react";
import { ElementIkonyMobil } from "../../../../components/ElementIkonyMobil";
import { Icon16Px59 } from "../../../../icons/Icon16Px59";
import { Icon24Px81 } from "../../../../icons/Icon24Px81";
import { Icon24Px94 } from "../../../../icons/Icon24Px94";
import { Icon24Px123 } from "../../../../icons/Icon24Px123";
import { Ikony25_1 } from "../../../../icons/Ikony25_1";
import { Ikony25_2 } from "../../../../icons/Ikony25_2";
import { Ikony25_4 } from "../../../../icons/Ikony25_4";
import { Ikony25_5 } from "../../../../icons/Ikony25_5";
import { Ikony25_7 } from "../../../../icons/Ikony25_7";
import { TypKaroseria } from "../../../../icons/TypKaroseria";
import { TypNahon } from "../../../../icons/TypNahon";

export const FrameWrapper = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-start gap-10 absolute top-[1936px] left-4">
      <div className="flex flex-col w-[328px] items-start gap-8 px-4 py-0 relative flex-[0_0_auto]">
        <div className="inline-flex h-4 items-center justify-center gap-2 relative">
          <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
            Predstavenie vozidla
          </div>
        </div>

        <div className="relative self-stretch w-full h-[332.04px] mr-[-6.00px]">
          <p className="absolute w-[296px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-5">
            Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom
            do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a
            má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú
            jazdu vždy, keď sadnete za volant.
          </p>

          <p className="absolute w-[262px] top-[130px] left-6 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-5">
            Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba.
            Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý
            zaujme na každej ceste.
          </p>

          <p className="absolute w-[262px] top-56 left-6 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-5">
            Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné
            technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné
            technológie a prvotriedne materiály vytvárajú interiér, ktorý je
            rovnako pohodlný ako atraktívny.
          </p>

          <img
            className="w-3 h-0.5 top-[227px] absolute left-0"
            alt="Vector"
            src="/img/vector-23-1.svg"
          />

          <img
            className="w-3 h-0.5 top-[132px] absolute left-0"
            alt="Vector"
            src="/img/vector-23-1.svg"
          />
        </div>
      </div>

      <img
        className="relative w-[329px] h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-9-6.svg"
      />

      <div className="flex flex-col w-[328px] items-start gap-8 px-4 py-0 relative flex-[0_0_auto]">
        <div className="inline-flex h-4 items-center justify-center gap-2 relative">
          <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
            Technické parametre
          </div>
        </div>

        <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <TypKaroseria className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Karoséria:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                SUV
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Icon24Px123 className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Počet dverí:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                4+1
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Ikony25_1 className="!relative !w-6 !h-6" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Výkon:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                4+1
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Ikony25_2 className="!relative !w-6 !h-6" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Objem valcov:
              </div>

              <div className="w-fit mt-[-1.00px] text-colors-ligh-gray-400 text-sm whitespace-nowrap relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                2998 cm3
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Icon24Px94 className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Spotreba:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                5.4l/100km
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Ikony25_4 className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Palivo:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Benzín
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Ikony25_5 className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Prevodovka:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Automatická
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <TypNahon className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Náhon:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                4×4
              </div>
            </div>
          </div>

          <div className="inline-flex h-8 items-center gap-2 pl-2 pr-0 py-0 relative">
            <Ikony25_7 className="!relative !w-6 !h-6" color="#E4FF56" />
            <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Rok výroby:
              </div>

              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6 whitespace-nowrap">
                2016
              </div>
            </div>
          </div>

          <div className="flex h-8 items-center gap-2 pl-2 pr-3.5 py-4 relative self-stretch w-full rounded-lg">
            <Icon24Px81
              className="!mt-[-12.00px] !mb-[-12.00px] !relative !w-6 !h-6"
              color="#E4FF56"
            />
            <div className="flex items-center gap-1 relative flex-1 grow mt-[-5.00px] mb-[-5.00px]">
              <div className="w-fit text-sm leading-6 whitespace-nowrap relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0]">
                Nájazd km:
              </div>

              <div className="flex-1 mt-[-1.00px] text-colors-ligh-gray-800 text-sm overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
                91000 km
              </div>
            </div>
          </div>
        </div>
      </div>

      <img
        className="relative w-[329px] h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-9-6.svg"
      />

      <div className="flex flex-col w-[328px] items-start gap-8 px-4 py-0 relative flex-[0_0_auto]">
        <div className="inline-flex h-4 items-center justify-center gap-2 relative">
          <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
            Výbava vozidla
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-[16px_16px] pt-0 pb-2 px-0 relative self-stretch w-full flex-[0_0_auto]">
          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Bluetooth
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              USB vstup
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Klimatizácia
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              GPS
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Tempomat
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="font-normal text-colors-white-800 text-xs relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
              4×4
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Parkovacie senzory
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Apple carplay
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Lorem ipsum
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Lorem ipsum
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Lorem ipsum
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Lorem ipsum
            </div>
          </div>

          <div className="inline-flex h-8 items-center justify-center gap-4 px-4 py-2 relative flex-[0_0_auto] bg-colors-black-600 rounded-lg">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              Lorem ipsum
            </div>
          </div>
        </div>
      </div>

      <img
        className="relative w-[329px] h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-9-6.svg"
      />

      <div className="flex flex-col w-[328px] items-start gap-10 px-4 py-0 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
          <ElementIkonyMobil
            className="!w-[57.14px] !relative"
            ellipse="/img/ellipse-1-3.svg"
            overlapGroupClassName="bg-[url(/img/rectangle-1001-1.svg)]"
            union="/img/union-10.svg"
          />
          <div className="inline-flex h-4 items-center justify-center gap-2 relative">
            <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
              V cene je zahrnuté
            </div>
          </div>
        </div>

        <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
          <div className="flex w-[296px] items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 p-1 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
              <Icon16Px59 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex items-center justify-center gap-2 relative flex-1 grow">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-7">
                Slovenská dialničná známka
              </div>
            </div>
          </div>

          <div className="flex w-[296px] items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 p-1 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
              <Icon16Px59 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex items-center justify-center gap-2 relative flex-1 grow">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-7">
                Havaríjne poistenie
              </div>
            </div>
          </div>

          <div className="flex w-[296px] items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 p-1 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
              <Icon16Px59 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex items-center justify-center gap-2 relative flex-1 grow">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-7">
                Poistenie zodpovednosti za škody
              </div>
            </div>
          </div>

          <div className="flex w-[296px] items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 p-1 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
              <Icon16Px59 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex items-center justify-center gap-2 relative flex-1 grow">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-7">
                Letné a zimné pneumatiky
              </div>
            </div>
          </div>

          <div className="flex w-[296px] items-center gap-2 relative flex-[0_0_auto]">
            <div className="inline-flex items-center gap-2 p-1 relative flex-[0_0_auto] bg-colors-dark-yellow-accent-200 rounded-[99px]">
              <Icon16Px59 className="!relative !w-4 !h-4" />
            </div>

            <div className="flex items-center justify-center gap-2 relative flex-1 grow">
              <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-7">
                Servisné náklady
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
