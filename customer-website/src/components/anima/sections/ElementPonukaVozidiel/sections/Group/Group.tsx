import React from "react";
import { FilterMobileButton } from "../../../../components/FilterMobileButton";
import { IconPx } from "../../../../components/IconPx";
import { ArrowIcon } from "../../../../components/ArrowIcon";

interface GroupProps {
  onFilterClick?: () => void;
}

export const Group = ({ onFilterClick }: GroupProps): JSX.Element => {
  return (
    <div className="absolute w-[360px] h-[200px] top-[616px] left-0">
      <div className="flex flex-col w-[360px] items-center px-4 py-0 absolute top-[88px] left-0">
        <div className="flex w-[359px] h-14 items-center justify-center gap-2 relative ml-[-15.50px] mr-[-15.50px]">
          <div className="inline-flex items-center relative flex-[0_0_auto]" style={{gap: '4px'}}>
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xs text-center tracking-[0] whitespace-nowrap" style={{lineHeight: '2em'}}>
              1462
            </div>

            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-xs tracking-[0] whitespace-nowrap" style={{lineHeight: '2em'}}>
              výsledky vyhľadávania
            </div>
          </div>

          <img
            className="relative w-px h-[15px] object-cover"
            alt="Line"
            src="https://c.animaapp.com/h23eak6p/img/line-3-6.svg"
          />

          <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
            <div className="w-4 h-4 relative">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="absolute top-0.5 left-0.5">
                <path d="M8.33333 1.66667L1.66667 8.33333M1.66667 1.66667L8.33333 8.33333" stroke="#FF505A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#FF505A] text-sm tracking-[0] whitespace-nowrap" style={{lineHeight: '1.7142857142857142em'}}>
              zrušiť filter
            </div>
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Line"
          src="https://c.animaapp.com/h23eak6p/img/line-8-4.svg"
        />

        <div className="flex w-[359px] h-14 items-center justify-center px-4 py-0 relative ml-[-15.50px] mr-[-15.50px]" style={{gap: '8px'}}>
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xs text-center tracking-[0] whitespace-nowrap" style={{lineHeight: '2em'}}>
            Zoradiť
          </div>

          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#F0F0F5] text-xs tracking-[0] whitespace-nowrap" style={{lineHeight: '2em'}}>
            Podľa obľúbenosi
          </div>

          <div className="w-5 h-5 relative">
            <svg width="15" height="7" viewBox="0 0 15 7" fill="none" className="absolute top-1.5 left-0.5">
              <path d="M1.51 1L7.51 6L13.51 1" stroke="#D7FF14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <button 
        onClick={onFilterClick}
        className="flex w-[328px] h-[72px] items-center justify-center gap-2 px-6 py-4 absolute left-4 top-0 bg-colors-black-600 rounded-2xl hover:bg-colors-black-500 transition-colors duration-200 cursor-pointer"
      >
        <div className="relative w-6 h-6">
          <img
            className="absolute w-5 h-5 top-0.5 left-0.5"
            alt="Filter icon"
            src="https://c.animaapp.com/h23eak6p/img/icon-24-px-60.svg"
          />
        </div>
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
          Filtrácia
        </div>
      </button>
    </div>
  );
};
