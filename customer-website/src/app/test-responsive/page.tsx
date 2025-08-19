"use client";

import React, { useState } from 'react';
import { ResponsiveVehicleDetail } from '../../components/vehicle-detail/ResponsiveVehicleDetail';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

export default function TestResponsivePage() {
  const [forcedBreakpoint, setForcedBreakpoint] = useState<number | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const { frameLeft, tableLeft, frameWidth, tableWidth, frameHeight, containerWidth, breakpoint, isStackedLayout } = useResponsiveLayout();

  return (
    <div className="min-h-screen bg-[#05050a]">
      {/* Header pre testovanie */}
      <div className="bg-black/50 text-white p-4 text-center">
        <h1 className="text-2xl font-bold text-[#F4D03F]">
          Responzívny Test - Detail Vozidla
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Testovanie všetkých breakpointov: 1728px → 1440px → 744px → 360px
        </p>
      </div>

      {/* Ovládacie tlačidlá */}
      <div className="bg-black/30 border-b border-gray-700 p-4">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">Simulovať rozlíšenie:</span>
            <button
              onClick={() => setForcedBreakpoint(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                forcedBreakpoint === null 
                  ? 'bg-[#F4D03F] text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Auto ({containerWidth}px)
            </button>
            <button
              onClick={() => setForcedBreakpoint(1728)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                forcedBreakpoint === 1728 
                  ? 'bg-[#F4D03F] text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Desktop XL (1728px)
            </button>
            <button
              onClick={() => setForcedBreakpoint(1440)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                forcedBreakpoint === 1440 
                  ? 'bg-[#F4D03F] text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Desktop (1440px)
            </button>
            <button
              onClick={() => setForcedBreakpoint(744)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                forcedBreakpoint === 744 
                  ? 'bg-[#F4D03F] text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Tablet (744px)
            </button>
            <button
              onClick={() => setForcedBreakpoint(360)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                forcedBreakpoint === 360 
                  ? 'bg-[#F4D03F] text-black' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              Mobile (360px)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showGrid 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {showGrid ? 'Skryť' : 'Zobraziť'} mriežku
            </button>
          </div>
        </div>
      </div>

      {/* Grid overlay */}
      {showGrid && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(244, 208, 63, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(244, 208, 63, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
          {/* Breakpoint indikátory */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-blue-500 opacity-50" />
          <div className="absolute top-2 left-[360px] w-px h-full bg-red-500 opacity-50" />
          <div className="absolute top-2 left-[744px] w-px h-full bg-yellow-500 opacity-50" />
          <div className="absolute top-2 left-[1440px] w-px h-full bg-green-500 opacity-50" />
          <div className="absolute top-2 left-[1728px] w-px h-full bg-blue-500 opacity-50" />
        </div>
      )}

      {/* Responzívny komponent */}
      <div 
        className="flex justify-center transition-all duration-300"
        style={{
          width: forcedBreakpoint || containerWidth,
          margin: '0 auto',
          overflow: forcedBreakpoint ? 'auto' : 'visible'
        }}
      >
        <ResponsiveVehicleDetail 
          vehicleData={{
            name: "Ford Mustang",
            images: [
              "/figma-assets/n-h-ad-vozidla-1.png",
              "/figma-assets/n-h-ad-vozidla-10.png", 
              "/figma-assets/n-h-ad-vozidla-12.png",
              "/figma-assets/n-h-ad-vozidla-14.png"
            ],
            description: "Testovací opis vozidla pre responzívne správanie"
          }}
          forcedWidth={forcedBreakpoint}
        />
      </div>

      {/* Inštrukcie pre testovanie */}
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-sm">
        <h3 className="font-bold text-[#F4D03F] mb-2">Testovanie breakpointov:</h3>
        <ul className="text-xs space-y-1">
          <li>• <span className="text-[#F4D03F]">1728px+</span>: Desktop XL (frame 200px, gap 32px)</li>
          <li>• <span className="text-[#F4D03F]">1440px</span>: Desktop (frame 160px, gap 7px)</li>
          <li>• <span className="text-[#F4D03F]">744px</span>: Tablet (stacked layout)</li>
          <li>• <span className="text-[#F4D03F]">360px</span>: Mobile (minimálne okraje)</li>
          <li>• Sleduj plynulé prechody</li>
          <li>• Žiadne prekrývanie</li>
        </ul>
      </div>

      {/* Vylepšené debug informácie */}
      <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-xs border border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <div 
            className={`w-3 h-3 rounded-full ${
              forcedBreakpoint ? 'bg-orange-500' : 'bg-green-500'
            }`} 
          />
          <h3 className="font-bold text-[#F4D03F]">
            {forcedBreakpoint ? 'Simulácia' : 'Live'} Debug
          </h3>
        </div>
        <div className="text-xs space-y-2">
          <div className="flex justify-between">
            <span>Šírka:</span>
            <span className="text-[#F4D03F] font-mono">{containerWidth}px</span>
          </div>
          <div className="flex justify-between">
            <span>Breakpoint:</span>
            <span className={`font-mono font-bold ${
              breakpoint === '1728' ? 'text-blue-400' :
              breakpoint === '1440' ? 'text-green-400' :
              breakpoint === '744' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {breakpoint}px
            </span>
          </div>
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between">
              <span>Frame:</span>
              <span className="text-[#F4D03F] font-mono text-right">
                {frameLeft}px<br/>
                {frameWidth}×{frameHeight}px
              </span>
            </div>
          </div>
          <div className="flex justify-between">
            <span>Table:</span>
            <span className="text-[#F4D03F] font-mono text-right">
              {tableLeft}px<br/>
              {tableWidth}px wide
            </span>
          </div>
          <div className="border-t border-gray-600 pt-2">
            <div className="flex justify-between">
              <span>Layout:</span>
              <span className={`font-bold ${
                isStackedLayout ? 'text-orange-400' : 'text-blue-400'
              }`}>
                {isStackedLayout ? 'Stacked' : 'Side-by-side'}
              </span>
            </div>
          </div>
          {forcedBreakpoint && (
            <div className="border-t border-orange-500 pt-2">
              <div className="text-orange-400 text-center font-bold">
                SIMULÁCIA AKTÍVNA
              </div>
              <div className="text-center text-orange-300">
                Skutočná: {window.innerWidth}px
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breakpoint indikátor v hornom rohu */}
      <div className="fixed top-4 right-4 z-50">
        <div className={`px-4 py-2 rounded-lg font-bold text-sm border-2 ${
          breakpoint === '1728' ? 'bg-blue-500/20 border-blue-500 text-blue-300' :
          breakpoint === '1440' ? 'bg-green-500/20 border-green-500 text-green-300' :
          breakpoint === '744' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300' :
          'bg-red-500/20 border-red-500 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              breakpoint === '1728' ? 'bg-blue-400' :
              breakpoint === '1440' ? 'bg-green-400' :
              breakpoint === '744' ? 'bg-yellow-400' :
              'bg-red-400'
            }`} />
            <span>
              {breakpoint === '1728' ? 'Desktop XL' :
               breakpoint === '1440' ? 'Desktop' :
               breakpoint === '744' ? 'Tablet' :
               'Mobile'}
            </span>
            <span className="opacity-70">({breakpoint}px)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
