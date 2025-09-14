'use client';

import React from 'react';

interface VehicleHeroProps {
  vehicleName: string;
  images: string[];
  className?: string;
}

export const VehicleHero: React.FC<VehicleHeroProps> = ({
  vehicleName,
  images,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Mobile Hero */}
      <div className="block md:hidden">
        <div className="flex w-[328px] h-64 items-end justify-end gap-2 p-4 absolute top-48 left-4 rounded-2xl overflow-hidden bg-[url(/assets/frame-170.png)] bg-cover bg-[50%_50%]">
          <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
            <div className="relative w-6 h-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="white"/>
              </svg>
            </div>
            <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-xs tracking-[0] leading-6 whitespace-nowrap">
              16
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Hero */}
      <div className="hidden md:block lg:hidden">
        <div className="flex flex-col w-[680px] items-start justify-end gap-2 absolute top-[104px] left-8">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-8 mt-[-1.00px] font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-[40px] tracking-[0] leading-[64px] whitespace-nowrap">
              {vehicleName}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Hero */}
      <div className="hidden lg:block">
        <div className="flex flex-col w-[1376px] items-start justify-end gap-2 absolute top-[104px] left-44">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-8 mt-[-1.00px] font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-[40px] tracking-[0] leading-[64px] whitespace-nowrap">
              {vehicleName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
