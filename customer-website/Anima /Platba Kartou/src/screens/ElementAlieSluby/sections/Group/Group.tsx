import React from "react";
import { ElementIconsDarkSmall } from "../../../../components/ElementIconsDarkSmall";

export const Group = (): JSX.Element => {
  return (
    <div className="absolute w-[344px] h-[77px] top-[88px] left-2">
      <div className="relative h-[77px]">
        <img
          className="absolute w-[177px] h-0.5 top-[19px] left-[39px]"
          alt="Line"
          src="/img/line-14.svg"
        />

        <img
          className="absolute w-[90px] h-0.5 top-[19px] left-[214px]"
          alt="Line"
          src="/img/line-15.svg"
        />

        <div className="flex w-[344px] items-start justify-between absolute top-0 left-0">
          <div className="flex flex-col w-20 items-center gap-4 relative">
            <ElementIconsDarkSmall
              className="bg-[url(/img/ellipse-2-2.svg)]"
              type="check-selected"
            />
            <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
              Ponuka
              <br />
              vozidiel
            </div>
          </div>

          <div className="flex flex-col w-20 items-center gap-4 relative">
            <ElementIconsDarkSmall
              className="bg-[url(/img/ellipse-2-3.svg)]"
              type="check-selected"
            />
            <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
              BMW 440i
            </div>
          </div>

          <div className="flex flex-col w-20 items-center gap-4 relative">
            <ElementIconsDarkSmall
              className="bg-[url(/img/ellipse-1-4.svg)]"
              divClassName="!text-colors-white-800"
              type="three-selected"
            />
            <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-[10px] text-center tracking-[0] leading-[14px]">
              Ďalšie služby
            </div>
          </div>

          <div className="flex flex-col w-20 items-center gap-4 relative">
            <ElementIconsDarkSmall
              className="bg-[url(/img/ellipse-1-5.svg)]"
              type="four-disabled"
            />
            <div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-[10px] text-center tracking-[0] leading-[14px]">
              Osobné údaje
              <br />a platba
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
