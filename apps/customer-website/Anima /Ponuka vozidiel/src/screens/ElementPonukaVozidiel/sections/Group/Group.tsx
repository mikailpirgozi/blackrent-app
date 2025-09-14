import React from "react";
import { FilterMobileButton } from "../../../../components/FilterMobileButton";
import { Icon16Px35 } from "../../../../icons/Icon16Px35";
import { Icon16Px65 } from "../../../../icons/Icon16Px65";

export const Group = (): JSX.Element => {
  return (
    <div className="absolute w-[360px] h-[200px] top-[616px] left-0">
      <div className="flex flex-col w-[360px] items-center px-4 py-0 absolute top-[88px] left-0">
        <div className="flex w-[359px] h-14 items-center justify-center gap-2 relative ml-[-15.50px] mr-[-15.50px]">
          <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-center tracking-[0] leading-6 whitespace-nowrap">
              1462
            </div>

            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
              výsledky vyhľadávania
            </div>
          </div>

          <img
            className="relative w-px h-[15px] object-cover"
            alt="Line"
            src="/img/line-3-5.svg"
          />

          <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
            <Icon16Px65 className="!relative !w-4 !h-4" color="#FF505A" />
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-red-accent-300 text-sm tracking-[0] leading-6 whitespace-nowrap">
              zrušiť filter
            </div>
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Line"
          src="/img/line-8-4.svg"
        />

        <div className="flex w-[359px] h-14 items-center justify-center gap-2 px-4 py-0 relative ml-[-15.50px] mr-[-15.50px]">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-center tracking-[0] leading-6 whitespace-nowrap">
            Zoradiť
          </div>

          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
            Podľa obľúbenosi
          </div>

          <Icon16Px35 className="!relative !w-5 !h-5" />
        </div>
      </div>

      <FilterMobileButton
        className="!absolute !left-4 !top-0"
        state="default"
      />
    </div>
  );
};
