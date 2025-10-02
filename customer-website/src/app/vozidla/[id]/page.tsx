'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveHeader } from '@/components/shared/ResponsiveHeader';
import { ResponsiveFooter } from '@/components/shared/ResponsiveFooter/ResponsiveFooter';
import { TabulkaObjednavky } from '@/components/booking/TabulkaObjednavky';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface VehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHeartFavorite, setIsHeartFavorite] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState('basic');
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Responzívny layout systém z test-responsive
  const { frameLeft, tableLeft, frameWidth, tableWidth, frameHeight, containerWidth, breakpoint, isStackedLayout } = useResponsiveLayout();
  
  // Stabilný breakpoint pre conditional rendering - používa CSS media queries logiku
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTabletMobile, setIsTabletMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsDesktop(width >= 1440);
      setIsTabletMobile(width < 1440);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  
  const vehicleImages = [
    '/assets/vehicle-main-image.png',
    '/assets/vehicle-thumb-1.png', 
    '/assets/vehicle-thumb-2.png',
    '/assets/vehicle-thumb-3.png',
    '/assets/vehicle-thumb-4.png'
  ];

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ford Mustang - BlackRent',
        text: 'Pozrite si toto vozidlo na BlackRent',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link bol skopírovaný do schránky!');
    }
  };

  const handleHeartClick = () => {
    setIsHeartFavorite(!isHeartFavorite);
    // Tu by sa volalo API pre pridanie/odobratie z obľúbených
  };

  const handlePromoCodeSubmit = () => {
    // Simulácia validácie promokódu
    if (promoCode.toLowerCase() === '0482023') {
      setPromoDiscount(20);
    } else {
      setPromoDiscount(0);
    }
  };

  const handlePromoCodeCancel = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setShowPromoInput(false);
  };

  // Dynamické prepočítavanie cien
  const basePrice = 200;
  const insurancePrice = 0; // Zahrnuté
  const depositPrices = {
    basic: 500,
    extended: 650,
    eu: 800,
    outside: 1000
  };
  
  const currentDeposit = depositPrices[selectedCountries as keyof typeof depositPrices] || 500;
  const totalPrice = basePrice + insurancePrice - promoDiscount;

  // Pokročilé scrollovanie pre booking panel s responzivitou
  useEffect(() => {
    let originalLeft: number | null = null;
    let originalWidth: number | null = null;
    
    const handleScroll = () => {
      const bookingPanel = document.getElementById('booking-panel');
      const footer = document.querySelector('footer');
      
      if (bookingPanel && !isStackedLayout) {
        const scrollY = window.scrollY;
        const headerHeight = 88;
        const minTop = headerHeight + 20;
        const panelHeight = bookingPanel.offsetHeight;
        
        // Získaj pozíciu footeru
        const footerTop = footer ? footer.offsetTop : document.body.scrollHeight;
        const maxScroll = footerTop - panelHeight - 100; // 100px padding od footeru
        
        // Zachytí pôvodnú pozíciu a šírku pri prvom scrollovaní
        if (originalLeft === null && scrollY <= 200) {
          const rect = bookingPanel.getBoundingClientRect();
          originalLeft = rect.left + window.scrollX;
          originalWidth = rect.width; // Zachytí pôvodnú šírku
        }
        
        if (scrollY > 200 && scrollY < maxScroll) {
          // Fixed scrollovanie - zachová pôvodnú horizontálnu pozíciu a šírku
          bookingPanel.style.position = 'fixed';
          bookingPanel.style.top = `${minTop}px`;
          bookingPanel.style.left = `${originalLeft}px`;
          bookingPanel.style.right = 'auto';
          bookingPanel.style.width = `${originalWidth}px`; // Používa zachytenú šírku
          bookingPanel.style.zIndex = '40';
          bookingPanel.style.transition = 'all 0.2s ease-out';
        } else if (scrollY >= maxScroll) {
          // Prestane scrollovať pri footeri - zachová pôvodnú horizontálnu pozíciu a šírku
          bookingPanel.style.position = 'absolute';
          bookingPanel.style.top = `${maxScroll - headerHeight}px`;
          bookingPanel.style.left = `${originalLeft}px`;
          bookingPanel.style.right = 'auto';
          bookingPanel.style.width = `${originalWidth}px`; // Používa zachytenú šírku
          bookingPanel.style.zIndex = '40';
        } else {
          // Normálny flow
          bookingPanel.style.position = 'static';
          bookingPanel.style.top = 'auto';
          bookingPanel.style.left = 'auto';
          bookingPanel.style.right = 'auto';
          bookingPanel.style.width = 'auto';
          bookingPanel.style.zIndex = 'auto';
          bookingPanel.style.transition = 'none';
        }
      }
    };

    // Throttle scroll events pre performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    window.addEventListener('resize', handleScroll); // Reaguj na zmenu veľkosti okna
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isStackedLayout, containerWidth, tableWidth]);

  return (
    <div className="w-screen bg-[#05050a] min-h-screen flex flex-col">
      {/* Header/Menu */}
      <div className="w-full h-[88px] z-50">
        <ResponsiveHeader />
      </div>

      <div 
        className="bg-[#05050a] mx-auto flex-1"
        style={{ width: containerWidth }}
      >
        {/* Vehicle Title */}
        <div 
          className="flex flex-col items-start justify-end gap-2 pt-20 pb-8"
          style={{
            paddingLeft: frameLeft,
            paddingRight: isStackedLayout ? frameLeft : 32
          }}
        >
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-10 mt-[-1.00px] font-sf-pro font-medium text-[#F0FF98] text-5xl tracking-[0] leading-[64px] whitespace-nowrap">
              Ford Mustang
            </div>
          </div>

          <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
            {/* Vehicle specs quick info */}
            <div className="flex gap-2">
              <div className="flex items-center">
                <div className="relative w-4 h-4">
                  <img src="/assets/icons/icon-vykon.svg" alt="Výkon" className="w-4 h-4" />
                </div>
                <div className="relative w-fit font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6 ml-1">
                  123 kW
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="relative w-4 h-4">
                  <img src="/assets/icons/icon-palivo.svg" alt="Palivo" className="w-4 h-4" />
                </div>
                <div className="relative w-fit font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6">
                  Benzín
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="relative w-4 h-4">
                  <img src="/assets/icons/icon-prevodovka.svg" alt="Prevodovka" className="w-4 h-4" />
                </div>
                <div className="relative w-fit font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6">
                  Automat
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <div className="relative w-4 h-4">
                  <img src="/assets/icons/icon-nahon.svg" alt="Náhon" className="w-4 h-4" />
                </div>
                <div className="relative w-fit font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6">
                  Predný
                </div>
              </div>
            </div>

            {/* Provider and actions */}
            <div id="avis-icons-container" className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
                <div className="relative w-[134px] h-5">
                  <img src="/assets/brands/blackrent-logo.svg" alt="BlackRent" className="w-[134px] h-5 brightness-0 invert" />
                </div>
                <div className="relative w-4 h-4">
                  <img src="/assets/icons/icon-info.svg" alt="Info" className="w-4 h-4" />
                </div>
              </div>

              <div className="relative w-px h-6 bg-[#28282D]"></div>

              <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
                <button 
                  onClick={handleShare}
                  className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-lg hover:bg-[#1E1E23] transition-colors"
                  aria-label="Zdieľať vozidlo"
                >
                  <img src="/assets/icons/icon-share.svg" alt="Share" className="w-6 h-6" />
                </button>

                <button 
                  onClick={() => setIsHeartFavorite(!isHeartFavorite)}
                  className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-lg hover:bg-[#1E1E23] transition-colors"
                  aria-label={isHeartFavorite ? "Odobrať z obľúbených" : "Pridať do obľúbených"}
                >
                  <img 
                    src="/assets/icons/icon-heart.svg" 
                    alt="Heart" 
                    className={`w-6 h-6 transition-colors ${isHeartFavorite ? 'filter brightness-0 saturate-100 hue-rotate-[60deg]' : ''}`} 
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div 
          className="flex gap-8"
          style={{
            paddingLeft: frameLeft,
            paddingRight: isStackedLayout ? frameLeft : 32,
            flexDirection: isStackedLayout ? 'column' : 'row'
          }}
        >
          {/* Vehicle Gallery Frame */}
          <div style={{ width: frameWidth, flexShrink: 0 }}>
          {/* Responzívny obrázok vozidla */}
          <div 
            className="w-full rounded-2xl bg-cover bg-center bg-no-repeat relative overflow-hidden cursor-pointer"
            style={{
              height: breakpoint === '744' ? '432px' : (breakpoint === '360' ? '256px' : '432px'),
              backgroundImage: `url(${vehicleImages[0]})`
            }}
            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length)}
          >
            {/* Photo counter overlay */}
            <div className="absolute top-4 right-4">
              <div className="inline-flex items-center gap-1 px-4 py-2 bg-black/50 rounded-lg">
                <img src="/assets/icons/icon-photo.svg" alt="Photo" className="w-4 h-4" />
                <span className="text-white text-xs font-medium">{vehicleImages.length}</span>
              </div>
            </div>
          </div>

          {/* Thumbnail galéria - pre desktop a tablet (744px+) rozlíšenia */}
          {(breakpoint === '1728' || breakpoint === '1440' || breakpoint === '744') && (
            <div 
              className="flex items-stretch"
              style={{
                gap: '24px',
                marginTop: '32px'
              }}
            >
              {vehicleImages.slice(1, 5).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index + 1)}
                  className={`flex-1 rounded-lg bg-gray-800 bg-cover bg-center transition-opacity hover:opacity-80 ${
                    index === 3 ? 'relative' : ''
                  }`}
                  style={{
                    backgroundImage: `url(${image})`,
                    height: '96px',
                    borderRadius: '8px'
                  }}
                >
                  {index === 3 && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <span className="text-white text-sm font-medium">viac</span>
                        <img src="/assets/icons/icon-photo.svg" alt="More photos" className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          </div>

          {/* Booking Panel */}
          <div id="booking-panel" style={{ width: tableWidth, flexShrink: 0 }}>
            <TabulkaObjednavky 
              initialState="default"
              onStateChange={(newState) => console.log('Vehicle booking state:', newState)}
            />
          </div>
        </div>

        {/* Additional Content - len pre desktop side-by-side layout */}
        {isDesktop && (
          <div 
            style={{
              paddingLeft: frameLeft,
              paddingRight: tableWidth + 32, // Tabulka šírka + 32px gap pre 1440px layout
              marginTop: '80px'
            }}
          >
            {/* Line separator */}
            <div className="w-full h-px bg-[#1E1E23] mb-10"></div>

            {/* Predstavenie vozidla */}
            <div className="flex flex-col mb-20" style={{ gap: '40px' }}>
              {/* Nadpis */}
              <div className="flex items-center" style={{ width: '260px', height: '16px' }}>
                <h3 className="font-sf-pro text-[#F0FF98] text-[20px] leading-[1.4] font-[650] tracking-[0]">
                  Predstavenie vozidla
                </h3>
              </div>

              {/* Text obsah - OPRAVENÉ podľa Figma dizajnu */}
              <div className="relative" style={{ width: '640px', height: '306px' }}>
                {/* Prvý odstavec */}
                <div className="absolute top-0 left-0" style={{ width: '640px', height: '89px' }}>
                  <p className="font-poppins font-normal text-[#F0F0F5] text-[16px] leading-[1.625] tracking-[0]">
                    Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.
                  </p>
                </div>
                
                {/* Druhý odstavec */}
                <div className="absolute" style={{ width: '567.47px', height: '63px', top: '120px', left: '51.2px' }}>
                  <p className="font-poppins font-normal text-[#F0F0F5] text-[16px] leading-[1.625] tracking-[0]">
                    Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                  </p>
                </div>
                
                {/* Tretí odstavec */}
                <div className="absolute" style={{ width: '567.47px', height: '89px', top: '217px', left: '51.2px' }}>
                  <p className="font-poppins font-normal text-[#F0F0F5] text-[16px] leading-[1.625] tracking-[0]">
                    Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.
                  </p>
                </div>

                {/* Dekoratívne čiary - OPRAVENÉ pozície podľa Figma */}
                <div className="absolute border-t-2 border-[#E4FF56]" style={{ width: '25.6px', height: '0px', top: '223px', left: '8.53px' }}></div>
                <div className="absolute border-t-2 border-[#E4FF56]" style={{ width: '25.6px', height: '0px', top: '126px', left: '8.53px' }}></div>
              </div>
            </div>

            {/* Cenové relácie */}
            <div className="flex flex-col gap-6 p-8 w-[640px] bg-[#0F0F14] rounded-2xl mb-20">
              <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>

              <div className="flex flex-col items-start relative self-stretch w-full">
                {/* Header */}
                <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b border-[#28282D]">
                  <div className="flex w-44 items-center gap-2 p-2">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                      Počet dní prenájmu
                    </div>
                  </div>
                  <div className="flex w-[142px] items-center justify-end gap-2 p-2">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Nájazd km/deň
                    </div>
                  </div>
                  <div className="flex w-[183px] items-center justify-end gap-2 p-2">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                      Cena prenájmu/deň
                    </div>
                  </div>
                </div>

                {/* Pricing Rows */}
                {[
                  { days: '0–1 dní', km: '300 km', price: '200 €' },
                  { days: '2–3 dní', km: '250 km', price: '175 €' },
                  { days: '4–7 dní', km: '210 km', price: '150 €' },
                  { days: '8–14 dní', km: '170 km', price: '130 €' },
                  { days: '15–22 dní', km: '150 km', price: '120 €' },
                  { days: '23–30 dní', km: '130 km', price: '110 €' },
                  { days: '31 a viac dní', km: '115 km', price: '100 €' }
                ].map((row, index) => (
                  <div key={index} className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b border-[#28282D]">
                    <div className="flex w-44 items-center gap-2 p-2">
                      <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                        {row.days}
                      </div>
                    </div>
                    <div className="flex w-[142px] items-center justify-end gap-2 p-2">
                      <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        {row.km}
                      </div>
                    </div>
                    <div className="flex w-[183px] items-center justify-end gap-2 p-2">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-base text-right tracking-[0] leading-6 whitespace-nowrap">
                        {row.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technické parametre */}
            <div className="flex flex-col gap-10 mb-20">
              <div className="flex justify-center items-center gap-2 p-4 h-4">
                <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Technické parametre
                </div>
              </div>

              <div className="flex justify-stretch items-stretch gap-4 w-[640px]">
                {/* Left Column */}
                <div className="flex flex-col gap-2 flex-1">
                  {[
                    { icon: 'icon-karoseria.svg', label: 'Karoséria:', value: 'SUV', color: '#BEBEC3' },
                    { icon: 'icon-dvere.svg', label: 'Počet dverí:', value: '4+1', color: '#BEBEC3' },
                    { icon: 'icon-vykon.svg', label: 'Výkon:', value: '275 kw', color: '#BEBEC3' },
                    { icon: 'icon-objem.svg', label: 'Objem valcov:', value: '2998 cm3', color: '#AAAAAF' }
                  ].map((spec, index) => (
                    <div key={index} className="flex items-center self-stretch gap-2 px-2 py-0">
                      <div className="relative w-6 h-6">
                        <img src={`/assets/icons/${spec.icon}`} alt={spec.label} className="w-6 h-6" style={{filter: 'brightness(0) saturate(100%) invert(87%) sepia(6%) saturate(1077%) hue-rotate(60deg) brightness(104%) contrast(93%)'}} />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6">
                          {spec.label}
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-sm tracking-[0] leading-6" style={{color: spec.color}}>
                          {spec.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Middle Column */}
                <div className="flex flex-col gap-2 flex-1">
                  {[
                    { icon: 'icon-spotreba.svg', label: 'Spotreba:', value: '5.4l/100km', color: '#BEBEC3' },
                    { icon: 'icon-palivo.svg', label: 'Palivo:', value: 'Benzín', color: '#BEBEC3' },
                    { icon: 'icon-prevodovka.svg', label: 'Prevodovka:', value: 'Automatická', color: '#BEBEC3' },
                    { icon: 'icon-nahon.svg', label: 'Náhon:', value: '4×4', color: '#BEBEC3' }
                  ].map((spec, index) => (
                    <div key={index} className="flex items-center self-stretch gap-2 px-2 py-2 rounded-lg">
                      <div className="relative w-6 h-6">
                        <img src={`/assets/icons/${spec.icon}`} alt={spec.label} className="w-6 h-6" style={{filter: 'brightness(0) saturate(100%) invert(87%) sepia(6%) saturate(1077%) hue-rotate(60deg) brightness(104%) contrast(93%)'}} />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6">
                          {spec.label}
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-sm tracking-[0] leading-6" style={{color: spec.color}}>
                          {spec.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-2 flex-1">
                  {[
                    { icon: 'icon-calendar.svg', label: 'Rok výroby:', value: '2016', color: '#BEBEC3' },
                    { icon: 'icon-km.svg', label: 'Nájazd km:', value: '91000 km', color: '#BEBEC3' }
                  ].map((spec, index) => (
                    <div key={index} className="flex items-center self-stretch gap-2 px-2 py-4 rounded-lg">
                      <div className="relative w-6 h-6">
                        <img src={`/assets/icons/${spec.icon}`} alt={spec.label} className="w-6 h-6" style={{filter: 'brightness(0) saturate(100%) invert(87%) sepia(6%) saturate(1077%) hue-rotate(60deg) brightness(104%) contrast(93%)'}} />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6">
                          {spec.label}
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-sm tracking-[0] leading-6" style={{color: spec.color}}>
                          {spec.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-[640px] h-px bg-[#1E1E23] mb-10"></div>

            {/* Výbava vozidla */}
            <div className="flex flex-col gap-10 w-[640px] mb-20">
              <div className="flex flex-col gap-2">
                <div className="flex justify-center items-center gap-2">
                  <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Výbava vozidla
                  </div>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-4 w-[640px]">
                {[
                  'Bluetooth', 'USB vstup', 'Klimatizácia', 'GPS', 'Tempomat', '4×4',
                  'Lorem ipsum', 'Parkovacie senzory', 'Apple carplay', 'Lorem ipsum',
                  'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum'
                ].map((feature, index) => (
                  <div key={index} className="flex justify-center items-center gap-4 px-4 py-2 h-8 bg-[#1E1E23] rounded-lg">
                    <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stacked layout content pre tablet/mobile */}
        {isTabletMobile && (
          <div 
            style={{
              paddingLeft: frameLeft,
              paddingRight: frameLeft,
              marginTop: '40px'
            }}
          >
            {/* Predstavenie vozidla - Mobile/Tablet */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-lg md:text-xl tracking-[0] leading-7 whitespace-nowrap">
                Predstavenie vozidla
              </div>
              <div className="text-[#F0F0F5] text-sm md:text-base leading-6">
                <p className="mb-4">Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.</p>
                <p className="mb-4">Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.</p>
                <p>Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.</p>
              </div>
            </div>

            {/* Technical Parameters - Mobile/Tablet */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-lg md:text-xl tracking-[0] leading-7 whitespace-nowrap">
                Technické parametre
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Karoséria:', value: 'SUV', icon: 'icon-karoseria.svg' },
                  { label: 'Počet dverí:', value: '4+1', icon: 'icon-dvere.svg' },
                  { label: 'Výkon:', value: '275 kw', icon: 'icon-vykon.svg' },
                  { label: 'Objem valcov:', value: '2998 cm3', icon: 'icon-objem.svg' },
                  { label: 'Spotreba:', value: '5.4l/100km', icon: 'icon-spotreba.svg' },
                  { label: 'Palivo:', value: 'Benzín', icon: 'icon-palivo.svg' },
                  { label: 'Prevodovka:', value: 'Automatická', icon: 'icon-prevodovka.svg' },
                  { label: 'Náhon:', value: '4×4', icon: 'icon-nahon.svg' },
                  { label: 'Rok výroby:', value: '2016', icon: 'icon-calendar.svg' },
                  { label: 'Nájazd km:', value: '91000 km', icon: 'icon-km.svg' }
                ].map((spec, index) => (
                  <div key={index} className="flex items-center gap-2 p-2">
                    <div className="relative w-5 h-5">
                      <img src={`/assets/icons/${spec.icon}`} alt={spec.label} className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6">
                        {spec.label}
                      </div>
                      <div className="relative w-fit font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6">
                        {spec.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Equipment - Mobile/Tablet */}
            <div className="flex flex-col gap-6 mb-8">
              <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-lg md:text-xl tracking-[0] leading-7 whitespace-nowrap">
                Výbava vozidla
              </div>
              <div className="flex items-center flex-wrap gap-3">
                {[
                  'Bluetooth', 'USB vstup', 'Klimatizácia', 'GPS', 'Tempomat', '4×4',
                  'Lorem ipsum', 'Parkovacie senzory', 'Apple carplay', 'Lorem ipsum',
                  'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum'
                ].map((feature, index) => (
                  <div key={index} className="flex justify-center items-center gap-2 px-3 py-1 h-7 bg-[#1E1E23] rounded-lg">
                    <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-xs md:text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Table - Mobile/Tablet */}
            <div className="flex flex-col gap-4 p-4 md:p-6 w-full bg-[#0F0F14] rounded-2xl mb-8">
              <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-lg md:text-xl tracking-[0] leading-7 whitespace-nowrap">
                Cenové relácie
              </div>
              <div className="flex flex-col items-start relative self-stretch w-full">
                {/* Header */}
                <div className="flex h-10 items-center justify-between px-0 py-3 relative self-stretch w-full border-b border-[#28282D]">
                  <div className="flex w-20 md:w-32 items-center gap-1 p-1">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-xs md:text-sm tracking-[0] leading-5 whitespace-nowrap">
                      Dní
                    </div>
                  </div>
                  <div className="flex w-16 md:w-24 items-center justify-end gap-1 p-1">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-xs md:text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                      Km/deň
                    </div>
                  </div>
                  <div className="flex w-16 md:w-24 items-center justify-end gap-1 p-1">
                    <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-xs md:text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                      Cena/deň
                    </div>
                  </div>
                </div>
                {/* Pricing Rows */}
                {[
                  { days: '0–1', km: '300', price: '200 €' },
                  { days: '2–3', km: '250', price: '175 €' },
                  { days: '4–7', km: '210', price: '150 €' },
                  { days: '8–14', km: '170', price: '130 €' },
                  { days: '15–22', km: '150', price: '120 €' },
                  { days: '23–30', km: '130', price: '110 €' },
                  { days: '31+', km: '115', price: '100 €' }
                ].map((row, index) => (
                  <div key={index} className="flex h-10 items-center justify-between px-0 py-3 relative self-stretch w-full border-b border-[#28282D]">
                    <div className="flex w-20 md:w-32 items-center gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-xs md:text-sm tracking-[0] leading-5 whitespace-nowrap">
                        {row.days}
                      </div>
                    </div>
                    <div className="flex w-16 md:w-24 items-center justify-end gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-xs md:text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                        {row.km}
                      </div>
                    </div>
                    <div className="flex w-16 md:w-24 items-center justify-end gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-xs md:text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                        {row.price}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Included in Price Section - OPRAVENÉ podľa Figma 1728px */}
        <div 
          id="included-in-price-section" 
          className="flex flex-col gap-2 relative bg-[#0F0F14] rounded-2xl mt-16"
          style={{
            marginLeft: frameLeft,
            marginRight: frameLeft,
            maxWidth: containerWidth - (frameLeft * 2),
            padding: '48px 112px 80px'
          }}
        >
          <div className="flex items-stretch gap-10 self-stretch">
            <div className="relative w-[92px] h-[88px]">
              {/* 3D Check Icon - stiahnutá z Figmy */}
              <img 
                src="/figma-assets/3D icons dark big.svg" 
                alt="Check" 
                className="w-[92px] h-[88px]" 
              />
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex justify-center items-center gap-2 h-[88px]">
                <div className="relative w-fit font-sf-pro font-[650] text-[#F0FF98] text-2xl tracking-[0] leading-7 text-center">
                  V cene je zahrnuté
                </div>
              </div>

              <div className="flex justify-stretch items-stretch gap-24">
                <div className="flex flex-col gap-8 flex-1">
                  {/* Slovenská dialničná známka - viacriakový text */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Slovenská<br />dialničná známka
                    </div>
                  </div>
                  
                  {/* Havaríjne poistenie */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Havaríjne poistenie
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8 flex-1">
                  {/* Dane a poplatky */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Dane a poplatky
                    </div>
                  </div>
                  
                  {/* Poistenie zodpovednosti za škody - viacriakový text */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Poistenie<br />zodpovednosti za škody
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-8 flex-1">
                  {/* Letné a zimné pneumatiky - viacriakový text */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Letné a zimné<br />pneumatiky
                    </div>
                  </div>
                  
                  {/* Servisné náklady */}
                  <div className="flex items-center self-stretch gap-4">
                    <div className="flex items-center gap-2 p-2 bg-[#283002] rounded-full">
                      <div className="relative w-6 h-6">
                        <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="relative w-fit font-poppins font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                      Servisné náklady
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responzívny Footer - kompletná sekcia ako na homepage */}
        <ResponsiveFooter />
      </div>
    </div>
  );
}