"use client";

import React from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { TabulkaObjednavky } from '../booking/TabulkaObjednavky';

interface ResponsiveVehicleDetailProps {
  vehicleData?: {
    name: string;
    images: string[];
    description: string;
  };
  className?: string;
  forcedWidth?: number | null;
}

export const ResponsiveVehicleDetail: React.FC<ResponsiveVehicleDetailProps> = ({
  vehicleData = {
    name: "Ford Mustang",
    images: ["/figma-assets/n-h-ad-vozidla-1.png"],
    description: "Zažite skutočnú jazdu plnú luxusu a výkonu..."
  },
  className = "",
  forcedWidth = null
}) => {
  const { frameLeft, tableLeft, frameWidth, tableWidth, frameHeight, containerWidth, breakpoint, isStackedLayout } = useResponsiveLayout(forcedWidth);

  return (
    <div 
      className={`relative bg-[#05050a] ${className}`}
      style={{ 
        width: containerWidth,
        minHeight: isStackedLayout 
          ? (breakpoint === '744' ? '1600px' : '1200px') // Prispôsobené pre 744px layout
          : '800px', // Desktop
        paddingBottom: '50px' // Malý padding na spodku
      }}
    >
      {/* Hlavný frame s obrázkom vozidla */}
      <div
        className="absolute transition-all duration-300 ease-out"
        style={{
          left: frameLeft, // 32px pre 744px, 16px pre 360px
          top: isStackedLayout 
            ? (breakpoint === '744' ? 200 : 192)  // Presné pozície z Figmy
            : 280, // Desktop pozícia
          width: frameWidth, // 680px pre 744px, 328px pre 360px
          height: frameHeight, // 560px pre 744px (432+32+96)
          zIndex: 1
        }}
      >
        {/* Hero obrázok vozidla */}
        <div 
          className="w-full rounded-2xl bg-cover bg-center bg-no-repeat relative overflow-hidden"
          style={{
            height: breakpoint === '744' ? '432px' : (breakpoint === '360' ? '256px' : frameHeight),
            backgroundImage: `url(${vehicleData.images[0]})`
          }}
        >
          {/* Photo counter overlay */}
          <div className="absolute bottom-4 right-4">
            <div className="inline-flex items-center gap-1 px-4 py-2 bg-black/50 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              </svg>
              <span className="text-white text-xs font-medium">16</span>
            </div>
          </div>
        </div>

        {/* Thumbnail galéria - pre desktop a tablet (744px+) rozlíšenia */}
        {(breakpoint === '1728' || breakpoint === '1440' || breakpoint === '744') && (
          <div 
            className="flex items-stretch"
            style={{
              gap: '24px', // 24px gap medzi thumbnails z Figmy
              marginTop: '32px' // 32px gap medzi hlavným obrázkom a thumbnails z Figmy
            }}
          >
            <div
              className="flex-1 rounded-lg bg-gray-800 bg-cover bg-center"
              style={{
                backgroundImage: `url(/figma-assets/n-h-ad-vozidla-10.png)`,
                height: '96px', // Presná výška z Figmy
                borderRadius: '8px' // 8px border radius z Figmy
              }}
            />
            <div
              className="flex-1 rounded-lg bg-gray-800 bg-cover bg-center"
              style={{
                backgroundImage: `url(/figma-assets/n-h-ad-vozidla-12.png)`,
                height: '96px',
                borderRadius: '8px'
              }}
            />
            <div
              className="flex-1 rounded-lg bg-gray-800 bg-cover bg-center"
              style={{
                backgroundImage: `url(/figma-assets/n-h-ad-vozidla-14.png)`,
                height: '96px',
                borderRadius: '8px'
              }}
            />
            <div
              className="flex-1 rounded-lg bg-gray-800 bg-cover bg-center relative"
              style={{
                backgroundImage: `url(/figma-assets/n-h-ad-vozidla-4.png)`,
                height: '96px',
                borderRadius: '8px'
              }}
            >
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-1">
                  <span className="text-white text-sm font-medium">viac</span>
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>

      {/* Tabulka objednávky */}
      <div
        className="absolute transition-all duration-300 ease-out"
        style={{
          left: isStackedLayout ? frameLeft : tableLeft,
          top: isStackedLayout 
            ? (breakpoint === '744' ? 824 : 480)  // Presné pozície z Figmy pre tabulku
            : 280, // Desktop pozícia
          width: tableWidth,
          zIndex: 2
        }}
      >
        {/* Používame presný design z perfektnej interaktívnej tabulky */}
        <div className="bg-[#1E1E23] rounded-3xl overflow-hidden">
          <div className="bg-[#141419] rounded-3xl overflow-hidden px-4 sm:px-6 md:px-8 py-6 sm:py-8">
            <header className="relative w-[206px] h-4 mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap mb-6 sm:mb-8">
              Prenájom vozidla
            </header>
            <TabulkaObjednavky />
          </div>
        </div>
      </div>



      {/* Debug info (iba pre development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50">
          <div>Screen: {containerWidth}px</div>
          <div>Frame: {frameLeft}px (w: {frameWidth}px)</div>
          <div>Table: {tableLeft}px (w: {tableWidth}px)</div>
          <div>Layout: {isStackedLayout ? 'Stacked' : 'Side-by-side'}</div>
        </div>
      )}
    </div>
  );
};
