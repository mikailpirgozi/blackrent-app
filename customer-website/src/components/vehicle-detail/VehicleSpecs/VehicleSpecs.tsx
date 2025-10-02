'use client';

import React from 'react';

interface VehicleSpecsProps {
  specs: {
    karoseria?: string;
    nahon?: string;
    palivo?: string;
    vykon?: string;
    spotreba?: string;
    emisie?: string;
  };
  className?: string;
}

export const VehicleSpecs: React.FC<VehicleSpecsProps> = ({
  specs,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Mobile Specs */}
      <div className="block md:hidden">
        <div className="flex flex-col w-[328px] items-start gap-6 absolute top-[1040px] left-4">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
              Špecifikácie
            </div>
            
            <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
              {specs.karoseria && (
                <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5S16.67 13 17.5 13 19 13.67 19 14.5 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 relative flex-1 grow">
                    <div className="relative w-fit font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Karoséria:
                    </div>
                    <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.karoseria}
                    </div>
                  </div>
                </div>
              )}

              {specs.nahon && (
                <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 relative flex-1 grow">
                    <div className="relative w-fit font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Náhon:
                    </div>
                    <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.nahon}
                    </div>
                  </div>
                </div>
              )}

              {specs.palivo && (
                <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.77 7.23L19.78 7.22L16.06 3.5L15 4.56L17.11 6.67C16.17 7.03 15.5 7.93 15.5 9V16.5C15.5 17.88 14.38 19 13 19S10.5 17.88 10.5 16.5V9C10.5 7.93 9.83 7.03 8.89 6.67L11 4.56L9.94 3.5L6.22 7.22L6.23 7.23C5.46 7.93 5 8.93 5 10V16.5C5 20.09 7.91 23 11.5 23H14.5C18.09 23 21 20.09 21 16.5V10C21 8.93 20.54 7.93 19.77 7.23Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 relative flex-1 grow">
                    <div className="relative w-fit font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Palivo:
                    </div>
                    <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.palivo}
                    </div>
                  </div>
                </div>
              )}

              {specs.vykon && (
                <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2.05V5.08C16.39 5.57 19 8.47 19 12C19 12.9 18.82 13.75 18.5 14.54L20.12 16.16C20.68 14.92 21 13.5 21 12C21 7.03 17.39 2.94 13 2.05ZM12 19C8.13 19 5 15.87 5 12C5 8.47 7.61 5.57 11 5.08V2.05C6.61 2.94 3 7.03 3 12C3 17.97 7.03 22 13 22C15.5 22 17.68 20.68 19.16 18.5L17.54 16.88C16.25 18.16 14.24 19 12 19Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex items-center gap-2 relative flex-1 grow">
                    <div className="relative w-fit font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Výkon:
                    </div>
                    <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.vykon}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tablet & Desktop Specs */}
      <div className="hidden md:block">
        <div className="flex flex-col items-start gap-6 relative">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch font-['SF_Pro-ExpandedMedium',Helvetica] font-medium text-[#F0FF98] text-2xl tracking-[0] leading-8">
              Špecifikácie
            </div>
            
            <div className="grid grid-cols-2 gap-4 relative self-stretch w-full">
              {specs.karoseria && (
                <div className="flex items-center gap-3 relative">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V20C3 20.55 3.45 21 4 21H5C5.55 21 6 20.55 6 20V19H18V20C18 20.55 18.45 21 19 21H20C20.55 21 21 20.55 21 20V12L18.92 6.01ZM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16ZM17.5 16C16.67 16 16 15.33 16 14.5S16.67 13 17.5 13 19 13.67 19 14.5 18.33 16 17.5 16ZM5 11L6.5 6.5H17.5L19 11H5Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Karoséria
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.karoseria}
                    </div>
                  </div>
                </div>
              )}

              {specs.nahon && (
                <div className="flex items-center gap-3 relative">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Náhon
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.nahon}
                    </div>
                  </div>
                </div>
              )}

              {specs.palivo && (
                <div className="flex items-center gap-3 relative">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.77 7.23L19.78 7.22L16.06 3.5L15 4.56L17.11 6.67C16.17 7.03 15.5 7.93 15.5 9V16.5C15.5 17.88 14.38 19 13 19S10.5 17.88 10.5 16.5V9C10.5 7.93 9.83 7.03 8.89 6.67L11 4.56L9.94 3.5L6.22 7.22L6.23 7.23C5.46 7.93 5 8.93 5 10V16.5C5 20.09 7.91 23 11.5 23H14.5C18.09 23 21 20.09 21 16.5V10C21 8.93 20.54 7.93 19.77 7.23Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Palivo
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.palivo}
                    </div>
                  </div>
                </div>
              )}

              {specs.vykon && (
                <div className="flex items-center gap-3 relative">
                  <div className="relative w-6 h-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2.05V5.08C16.39 5.57 19 8.47 19 12C19 12.9 18.82 13.75 18.5 14.54L20.12 16.16C20.68 14.92 21 13.5 21 12C21 7.03 17.39 2.94 13 2.05ZM12 19C8.13 19 5 15.87 5 12C5 8.47 7.61 5.57 11 5.08V2.05C6.61 2.94 3 7.03 3 12C3 17.97 7.03 22 13 22C15.5 22 17.68 20.68 19.16 18.5L17.54 16.88C16.25 18.16 14.24 19 12 19Z" fill="#BEBEC3"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="font-['Poppins',Helvetica] font-normal text-[#9B9BA0] text-sm tracking-[0] leading-5">
                      Výkon
                    </div>
                    <div className="font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-5">
                      {specs.vykon}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
