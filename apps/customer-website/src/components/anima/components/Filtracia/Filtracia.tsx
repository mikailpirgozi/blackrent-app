/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { FilterTags } from "../FilterTags";
import { IconPx } from "../IconPx";
import { TlacitkoNaTmavemWrapper } from "../TlacitkoNaTmavemWrapper";

interface Props {
  type: "default";
  className: any;
  iconPxTypArrowDown?: string;
  iconPxImg?: string;
  iconPxTypArrowDown1?: string;
  iconPxTypArrowDown2?: string;
  iconPxTypArrowDown3?: string;
  iconPxTypArrowDown4?: string;
  iconPxTypArrowDown5?: string;
  iconPxTypArrowDown6?: string;
  iconPxTypArrowDown7?: string;
  filterTagsIconPxTypArrowDown?: string;
}

export const Filtracia = ({
  type,
  className,
  iconPxTypArrowDown = "/assets/misc/icon-16-px-32.svg",
  iconPxImg = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown1 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown2 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown3 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown4 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown5 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown6 = "/assets/misc/icon-16-px-32.svg",
  iconPxTypArrowDown7 = "/assets/misc/icon-16-px-32.svg",
  filterTagsIconPxTypArrowDown = "/assets/misc/icon-16-px-32.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-64 items-center gap-6 pt-6 pb-10 px-4 relative bg-colors-black-400 rounded-2xl overflow-hidden ${className}`}
    >
      <div className="h-4 items-center gap-2 px-2 py-0 flex relative self-stretch w-full">
        <div className="relative w-fit mt-[-1.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Dostupnosť
        </div>
      </div>

      <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="bg-colors-black-800 flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full rounded-lg">
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Miesto vyzdvihnutia
              </div>
            </div>

            <IconPx
              className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
              typ="arrow-down"
              typArrowDown={iconPxTypArrowDown}
            />
          </div>

          <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Deň vyzdvihnutia
              </div>
            </div>

            <IconPx
              className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
              typ="arrow-down"
              typArrowDown={iconPxImg}
            />
          </div>

          <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Deň vrátenia
              </div>
            </div>

            <IconPx
              className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
              typ="arrow-down"
              typArrowDown={iconPxTypArrowDown1}
            />
          </div>
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-14-3.svg"
      />

      <div className="flex h-4 items-center gap-2 px-2 py-0 relative self-stretch w-full">
        <div className="relative w-fit mt-[-1.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Cena
        </div>
      </div>

      <div className="flex flex-col items-start pt-2 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
        <div className="h-10 px-4 py-2 flex items-center gap-2 relative self-stretch w-full">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            Počet dní
          </div>
        </div>

        <div className="relative self-stretch w-full h-10">
          <div className="absolute w-48 h-5 top-0.5 left-4">
            <img
              className="absolute w-[184px] h-1 top-2 left-0"
              alt="Line"
              src="/assets/misc/line-5-6.svg"
            />

            <div className="absolute w-5 h-5 top-0 left-[172px] bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
          </div>

          <div className="absolute h-2 top-[31px] left-[186px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            31+
          </div>
        </div>

        <div className="inline-flex h-10 pl-4 pr-2 py-2 items-center gap-2 relative">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            Cena/1deň
          </div>
        </div>

        <div className="relative self-stretch w-full h-10">
          <div className="absolute h-2 top-[31px] left-[173px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            400€
          </div>

          <div className="absolute h-2 top-[31px] left-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            30€
          </div>

          <div className="absolute w-48 h-5 top-0.5 left-4">
            <img
              className="absolute w-[35px] h-1 top-2 left-3.5"
              alt="Line"
              src="/assets/misc/line-6-11.svg"
            />

            <img
              className="w-[54px] left-[130px] absolute h-1 top-2"
              alt="Line"
              src="/assets/misc/line-8-7.svg"
            />

            <img
              className="absolute w-[172px] h-1 top-2 left-3"
              alt="Line"
              src="/assets/misc/line-7-9.svg"
            />

            <div className="absolute w-5 h-5 top-0 left-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />

            <div className="absolute w-5 h-5 top-0 left-[172px] bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
          </div>
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      <div className="h-4 pl-2 pr-4 py-4 flex items-center gap-2 relative self-stretch w-full">
        <div className="mt-[-17.50px] mb-[-9.50px] font-semibold text-colors-white-800 text-base relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
          Autopožičovňa
        </div>
      </div>

      <div className="bg-colors-black-600 flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full rounded-lg">
        <div className="gap-1 flex-1 grow flex items-center relative">
          <div className="mt-[-1.00px] font-medium text-colors-ligh-gray-800 text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
            Autopožičovňa
          </div>
        </div>

        <IconPx
          className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
          typ="arrow-down"
          typArrowDown={iconPxTypArrowDown2}
        />
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      <div className="flex h-4 pl-2 pr-4 py-4 self-stretch w-full items-center gap-2 relative">
        <div className="relative w-fit mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Značka vozidla
        </div>
      </div>

      <div className="h-10 gap-0.5 pl-4 pr-3.5 py-3 self-stretch w-full bg-colors-black-600 rounded-lg flex items-center relative">
        <div className="gap-1 flex-1 grow flex items-center relative">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            Značka
          </div>
        </div>

        <IconPx
          className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
          typ="arrow-down"
          typArrowDown={iconPxTypArrowDown3}
        />
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      <div className="flex h-4 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full">
        <div className="relative w-[187px] mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
          Parametre vozidla
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Karoséria
            </div>
          </div>

          <IconPx
            className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
            typ="arrow-down"
            typArrowDown={iconPxTypArrowDown4}
          />
        </div>

        <div className="flex-col items-start pt-2 pb-6 px-0 flex-[0_0_auto] bg-colors-black-600 rounded-lg flex relative self-stretch w-full">
          <div className="h-10 px-4 py-2 flex items-center gap-2 relative self-stretch w-full">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Rok výroby
            </div>
          </div>

          <div className="relative self-stretch w-full h-10">
            <div className="absolute h-2 top-[31px] left-[177px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              2024
            </div>

            <div className="absolute h-2 top-[31px] left-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              2003
            </div>

            <div className="absolute w-48 h-5 top-0.5 left-4">
              <img
                className="absolute w-[35px] h-1 top-2 left-3.5"
                alt="Line"
                src="/assets/misc/line-6-11.svg"
              />

              <img
                className="w-[18px] left-[162px] absolute h-1 top-2"
                alt="Line"
                src="/assets/misc/line-8-8.svg"
              />

              <img
                className="absolute w-[157px] h-1 top-2 left-3"
                alt="Line"
                src="/assets/misc/line-7-11.svg"
              />

              <div className="absolute w-5 h-5 top-0 left-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />

              <div className="absolute w-5 h-5 top-0 left-[172px] bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
            </div>
          </div>
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Palivo
            </div>
          </div>

          <IconPx
            className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
            typ="arrow-down"
            typArrowDown={iconPxTypArrowDown5}
          />
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Prevodovka
            </div>
          </div>

          <IconPx
            className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
            typ="arrow-down"
            typArrowDown={iconPxTypArrowDown6}
          />
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Pohon
            </div>
          </div>

          <IconPx
            className="!h-4 !relative !left-[unset] !w-4 !top-[unset]"
            typ="arrow-down"
            typArrowDown={iconPxTypArrowDown7}
          />
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-14-3.svg"
      />

      <div className="flex h-4 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full">
        <div className="relative w-[187px] mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
          Výbava
        </div>
      </div>

      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-wrap items-start gap-[16px_8px] relative self-stretch w-full flex-[0_0_auto]">
          <FilterTags
            className="!flex-[0_0_auto]"
            text="Bluetooth"
            type="default"
          />
          <FilterTags
            className="!flex-[0_0_auto]"
            text="USB vstup"
            type="default"
          />
          <FilterTags
            className="!flex-[0_0_auto]"
            text="Klimatizácia"
            type="default"
          />
          <FilterTags
            className="!flex-[0_0_auto]"
            text="Apple carplay"
            type="default"
          />
          <FilterTags className="!flex-[0_0_auto]" text="GPS" type="default" />
          <FilterTags
            className="!flex-[0_0_auto]"
            text="Tempomat"
            type="default"
          />
          <FilterTags className="!flex-[0_0_auto]" text="4×4" type="default" />
          <FilterTags
            className="!flex-[0_0_auto]"
            text="Parkovacie senzory"
            type="default"
          />
          <FilterTags
            className="!flex-[0_0_auto]"
            iconPxTypArrowDown={filterTagsIconPxTypArrowDown}
            type="more-default"
          />
        </div>

        <TlacitkoNaTmavemWrapper
          className="!pl-6 !pr-5 !py-4"
          iconPx="/assets/misc/icon-24-px-86.svg"
          iconPxClassName="!mt-[-4.00px] !mb-[-4.00px]"
          text="Vyhľadať"
          tlacitkoNaTmavem="normal"
        />
      </div>
    </div>
  );
};
