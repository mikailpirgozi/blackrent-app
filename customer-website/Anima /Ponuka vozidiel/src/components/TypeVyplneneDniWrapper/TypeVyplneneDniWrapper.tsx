/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px35 } from "../../icons/Icon16Px35";
import { FilterTags } from "../FilterTags";
import { TlacitkoNaTmavemWrapper } from "../TlacitkoNaTmavemWrapper";

interface Props {
  type: "vyplnene-dni-osa";
  className: any;
  frameClassName: any;
}

export const TypeVyplneneDniWrapper = ({
  type,
  className,
  frameClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[308px] items-center gap-6 pt-6 pb-10 px-4 relative bg-colors-black-400 rounded-2xl overflow-hidden ${className}`}
    >
      <div className="flex h-4 items-center gap-2 px-2 py-0 relative self-stretch w-full">
        <div className="relative w-fit mt-[-1.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Dostupnosť
        </div>
      </div>

      <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div
            className={`flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg ${frameClassName}`}
          >
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Miesto vyzdvihnutia
              </div>
            </div>

            <Icon16Px35 className="!relative !w-4 !h-4" />
          </div>

          <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Deň vyzdvihnutia
              </div>
            </div>

            <Icon16Px35 className="!relative !w-4 !h-4" />
          </div>

          <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
            <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                Deň vrátenia
              </div>
            </div>

            <Icon16Px35 className="!relative !w-4 !h-4" />
          </div>
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-14.svg"
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

        <div className="self-stretch w-full relative h-10">
          <div className="absolute w-[244px] h-5 top-0.5 left-4">
            <img
              className="absolute w-[244px] h-1 top-2 left-0"
              alt="Line"
              src="/img/line-5.svg"
            />

            <div className="absolute w-5 h-5 top-0 left-56 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
          </div>

          <div className="absolute h-2 top-[31px] left-60 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            31+
          </div>
        </div>

        <div className="inline-flex h-10 pl-4 pr-2 py-2 items-center gap-2 relative">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            Cena/1deň
          </div>
        </div>

        <div className="w-[276px] relative h-10">
          <div className="absolute h-2 top-[31px] left-[228px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            320€
          </div>

          <div className="absolute h-2 top-[31px] left-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            70€
          </div>

          <div className="absolute w-[236px] h-5 top-0.5 left-4">
            <img
              className="absolute w-[53px] h-1 top-2 left-0"
              alt="Line"
              src="/img/line-6-1.svg"
            />

            <img
              className="w-[58px] left-[178px] absolute h-1 top-2"
              alt="Line"
              src="/img/line-8.svg"
            />

            <img
              className="absolute w-[132px] h-1 top-2 left-12"
              alt="Line"
              src="/img/line-7.svg"
            />

            <div className="left-10 absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />

            <div className="left-[168px] absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
          </div>
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-11.svg"
      />

      <div className="h-4 pl-2 pr-4 py-4 flex items-center gap-2 relative self-stretch w-full">
        <div className="relative w-fit mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Autopožičovňa
        </div>
      </div>

      <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
        <div className="gap-1 flex-1 grow flex items-center relative">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            Nezáleží
          </div>
        </div>

        <Icon16Px35 className="!relative !w-4 !h-4" />
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-11.svg"
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

        <Icon16Px35 className="!relative !w-4 !h-4" />
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-11.svg"
      />

      <div className="flex h-4 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full">
        <div className="relative w-[187px] mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
          Parametre vozidla
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Karoséria
            </div>
          </div>

          <Icon16Px35 className="!relative !w-4 !h-4" />
        </div>

        <div className="flex flex-col items-start pt-2 pb-6 px-0 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
          <div className="h-10 px-4 py-2 flex items-center gap-2 relative self-stretch w-full">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Rok výroby
            </div>
          </div>

          <div className="w-[276px] relative h-10">
            <div className="absolute h-2 top-[31px] left-[234px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              2018
            </div>

            <div className="absolute h-2 top-[31px] left-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              2007
            </div>

            <div className="absolute w-[244px] h-5 top-0.5 left-4">
              <img
                className="absolute w-[49px] h-1 top-2 left-0"
                alt="Line"
                src="/img/line-6-2.svg"
              />

              <img
                className="w-[74px] left-[170px] absolute h-1 top-2"
                alt="Line"
                src="/img/line-8-1.svg"
              />

              <img
                className="absolute w-[156px] h-1 top-2 left-8"
                alt="Line"
                src="/img/line-7-2.svg"
              />

              <div className="left-6 absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />

              <div className="left-44 absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-[10px] border-2 border-solid border-colors-black-600" />
            </div>
          </div>
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Palivo
            </div>
          </div>

          <Icon16Px35 className="!relative !w-4 !h-4" />
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Prevodovka
            </div>
          </div>

          <Icon16Px35 className="!relative !w-4 !h-4" />
        </div>

        <div className="flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative self-stretch w-full bg-colors-black-600 rounded-lg">
          <div className="gap-1 flex-1 grow flex items-center relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              Pohon
            </div>
          </div>

          <Icon16Px35 className="!relative !w-4 !h-4" />
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/img/line-14.svg"
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
          <FilterTags className="!flex-[0_0_auto]" type="more-default" />
        </div>

        <TlacitkoNaTmavemWrapper
          className="!pl-6 !pr-5 !py-4"
          text="Vyhľadať"
          tlacitkoNaTmavem="normal"
        />
      </div>
    </div>
  );
};

TypeVyplneneDniWrapper.propTypes = {
  type: PropTypes.oneOf(["vyplnene-dni-osa"]),
};
