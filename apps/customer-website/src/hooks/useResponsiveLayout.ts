"use client";

import { useEffect, useState } from 'react';

interface ResponsiveLayoutPositions {
  frameLeft: number;
  tableLeft: number;
  frameWidth: number;
  tableWidth: number;
  frameHeight: number;
  containerWidth: number;
  breakpoint: '1728' | '1440' | '744' | '360';
  isStackedLayout: boolean;
}

export function useResponsiveLayout(forcedWidth?: number | null): ResponsiveLayoutPositions {
  const [screenWidth, setScreenWidth] = useState(1440); // Default pre SSR

  useEffect(() => {
    function handleResize() {
      setScreenWidth(window.innerWidth);
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Použijeme forcedWidth ak je nastavená, inak skutočnú šírku
  const effectiveWidth = forcedWidth || screenWidth;

  // PEVNÉ HODNOTY Z FIGMA DIZAJNU - žiadne dynamické výpočty!
  const getLayoutSpecs = (width: number) => {
    if (width >= 1728) {
      return {
        frameLeft: 200,        // Frame 170 pozícia
        frameWidth: 761,       // Frame 170 šírka
        frameHeight: 560,      // Frame výška: 432px (obrázok) + 32px (gap) + 96px (thumbnails)
        tableLeft: 993,        // Tabulka pozícia (200 + 761 + 32 gap)
        tableWidth: 536,       // Tabulka šírka
        breakpoint: '1728' as const,
        isStackedLayout: false
      };
    }
    
    if (width >= 1440) {
      return {
        frameLeft: 160,        // Frame 170 pozícia (fill + align-self: stretch)
        frameWidth: 640,       // Vypočítané z 1440 - 160 - 448 - 192 (gaps/margins)
        frameHeight: 560,      // Frame výška: 432px (obrázok) + 32px (gap) + 96px (thumbnails)
        tableLeft: 807,        // Tabulka pozícia
        tableWidth: 448,       // Tabulka šírka
        breakpoint: '1440' as const,
        isStackedLayout: false
      };
    }
    
    if (width >= 744) {
      return {
        frameLeft: 32,         // Tablet padding z Figmy
        frameWidth: 680,       // Frame šírka z Figmy (presne)
        frameHeight: 560,      // Hlavný obrázok (432px) + gap (32px) + thumbnails (96px) = 560px
        tableLeft: 32,         // Stacked layout - rovnaká pozícia ako frame
        tableWidth: 680,       // Tabulka šírka na tablet
        breakpoint: '744' as const,
        isStackedLayout: true
      };
    }
    
    // Mobile 360px a menšie
    return {
      frameLeft: 16,           // Mobile padding
      frameWidth: 328,         // Frame šírka na mobile (360 - 16*2)
      frameHeight: 256,        // Frame výška na mobile (menšia)
      tableLeft: 16,           // Stacked layout - rovnaká pozícia ako frame
      tableWidth: 328,         // Tabulka šírka na mobile (360 - 16*2)
      breakpoint: '360' as const,
      isStackedLayout: true
    };
  };

  const specs = getLayoutSpecs(effectiveWidth);

  return {
    frameLeft: specs.frameLeft,
    tableLeft: specs.tableLeft,
    frameWidth: specs.frameWidth,
    tableWidth: specs.tableWidth,
    frameHeight: specs.frameHeight,
    containerWidth: effectiveWidth,
    breakpoint: specs.breakpoint,
    isStackedLayout: specs.isStackedLayout
  };
}