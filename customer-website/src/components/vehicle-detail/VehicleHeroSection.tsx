'use client';

import React from 'react';

interface VehicleHeroSectionProps {
  vehicleData: {
    name: string;
    power: string;
    fuel: string;
    transmission: string;
    drivetrain: string;
  };
  className?: string;
}

export const VehicleHeroSection: React.FC<VehicleHeroSectionProps> = ({
  vehicleData,
  className = ""
}) => {
  return (
    <div 
      className={`flex flex-col gap-2 ${className}`}
      style={{ width: '1120px' }} // Presná šírka z Figmy
    >
      {/* Názov vozidla */}
      <h1 
        className="font-sf-pro font-medium text-[#F0FF98]"
        style={{
          fontSize: '48px',
          lineHeight: '1.3333333333333333em',
          width: '375px',
          height: '40px'
        }}
      >
        {vehicleData.name}
      </h1>

      {/* Technické parametre a akcie */}
      <div className="flex justify-between items-center w-full gap-[153px]">
        {/* Technické parametre */}
        <div className="flex gap-2">
          {/* Výkon */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M4 1L7 6H5V13L1 8H3V1H4Z" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <span className="font-poppins font-normal text-sm leading-[1.7142857142857142em] text-[#BEBEC3]">
              {vehicleData.power}
            </span>
          </div>

          {/* Palivo */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2H10V12H2V2ZM12 4V10H11V4H12ZM1 1V13H11V11H13V3H11V1H1Z" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <span className="font-poppins font-normal text-sm leading-[1.7142857142857142em] text-[#BEBEC3]">
              {vehicleData.fuel}
            </span>
          </div>

          {/* Prevodovka */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                <path d="M6 1V12M2 3H10M2 9H10" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <span className="font-poppins font-normal text-sm leading-[1.7142857142857142em] text-[#BEBEC3]">
              {vehicleData.transmission}
            </span>
          </div>

          {/* Náhon */}
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                <path d="M2 3H10V11H2V3ZM6 1V3M6 11V13" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </div>
            <span className="font-poppins font-normal text-sm leading-[1.7142857142857142em] text-[#BEBEC3]">
              {vehicleData.drivetrain}
            </span>
          </div>
        </div>

        {/* Poskytovateľ vozidla a akcie */}
        <div className="flex items-center gap-2">
          {/* BlackRent logo */}
          <div className="flex items-center gap-1.5">
            <div className="flex flex-col gap-2">
              <svg width="134" height="20" viewBox="0 0 134 20" fill="none">
                <path d="M0 0H134V20H0V0Z" fill="#BEBEC3"/>
                <text x="67" y="14" textAnchor="middle" className="text-xs font-medium" fill="#05050A">
                  BlackRent
                </text>
              </svg>
            </div>
            <div className="w-4 h-4 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
                <path d="M5 7L7 9L9 5" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </div>
          </div>

          {/* Vertikálna čiara */}
          <div className="w-px h-6 bg-[#28282D]"></div>

          {/* Share a Heart tlačidlá */}
          <div className="flex items-center gap-1">
            {/* Share tlačidlo */}
            <button className="w-10 h-10 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-[#28282D] transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 7C16.1046 7 17 6.10457 17 5C17 3.89543 16.1046 3 15 3C13.8954 3 13 3.89543 13 5C13 5.18 13.02 5.36 13.06 5.53L7.5 8.82C7.1 8.4 6.58 8.15 6 8.15C4.89543 8.15 4 9.04543 4 10.15C4 11.2546 4.89543 12.15 6 12.15C6.58 12.15 7.1 11.9 7.5 11.48L13.06 14.77C13.02 14.94 13 15.12 13 15.3C13 16.4046 13.8954 17.3 15 17.3C16.1046 17.3 17 16.4046 17 15.3C17 14.1954 16.1046 13.3 15 13.3C14.42 13.3 13.9 13.55 13.5 13.97L7.94 10.68C7.98 10.51 8 10.33 8 10.15C8 9.97 7.98 9.79 7.94 9.62L13.5 6.33C13.9 6.75 14.42 7 15 7Z" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </button>

            {/* Heart tlačidlo */}
            <button className="w-10 h-10 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-[#28282D] transition-colors">
              <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
                <path d="M11 18.5L9.55 17.2C4.4 12.6 1 9.58 1 5.95C1 3.34 3.08 1.25 5.7 1.25C7.14 1.25 8.52 1.92 9.44 2.98C10.36 1.92 11.74 1.25 13.18 1.25C15.8 1.25 17.88 3.34 17.88 5.95C17.88 9.58 14.48 12.6 9.33 17.2L11 18.5Z" stroke="#BEBEC3" strokeWidth="1" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
