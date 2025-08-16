'use client';

import React, { useState, useEffect } from 'react';
import { ResponsiveHeader } from '@/components/shared/ResponsiveHeader';
import { ResponsiveFooter } from '@/components/shared/ResponsiveFooter/ResponsiveFooter';
import { TabulkaObjednavky } from '@/components/booking/TabulkaObjednavky';

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

  // Scroll behavior for booking panel and AVIS icons
  useEffect(() => {
    const handleScroll = () => {
      const bookingPanel = document.getElementById('booking-panel');
      const avisIcons = document.getElementById('avis-icons-container'); // AVIS icons container
      
      // Reset AVIS icons to original position first
      if (avisIcons) {
        avisIcons.style.position = '';
        avisIcons.style.top = '';
        avisIcons.style.left = '';
        avisIcons.style.right = '';
        avisIcons.style.transform = '';
        avisIcons.style.zIndex = '';
      }
      // Find the main vehicle image container
      const vehicleImageContainer = document.querySelector('.relative.w-\\[761px\\].h-\\[432px\\]') || 
                                   document.querySelector('img[alt*="vehicle"], img[alt*="car"]')?.closest('.relative');
      const includedSection = document.getElementById('included-in-price-section');
      
      if (!bookingPanel || !vehicleImageContainer || !includedSection) return;

      const scrollPosition = window.scrollY;
      const imageTop = vehicleImageContainer.offsetTop;
      const includedSectionTop = includedSection.offsetTop;
      
      const initialTop = 280;
      const avisInitialTop = 200; // AVIS icons start position
      const imageAlignPoint = imageTop;
      const stopPoint = includedSectionTop - 900; // Stop much higher before "V cene je zahrnuté"
      
      if (scrollPosition >= stopPoint) {
        // Stop scrolling - panel becomes absolute and stays in place
        bookingPanel.style.position = 'absolute';
        bookingPanel.style.top = `${stopPoint + 50}px`;
        bookingPanel.style.right = '32px';
        
        // Also stop AVIS icons - keep bigger gap above booking panel
        if (avisIcons) {
          // Get original position before any changes
          const originalRect = avisIcons.getBoundingClientRect();
          const originalLeft = originalRect.left + window.scrollX;
          
          avisIcons.style.position = 'absolute';
          avisIcons.style.top = `${stopPoint - 70}px`; // Keep 120px gap above booking panel (stopPoint + 50 - 120 = stopPoint - 70)
          avisIcons.style.left = `${originalLeft}px`; // Keep exact original horizontal position
          avisIcons.style.zIndex = '30';
        }
      } else {
        // Start moving up immediately from beginning of scroll
        // Calculate how much to move based on scroll progress toward image alignment
        const scrollRange = imageAlignPoint; // Distance from 0 to image top
        const scrollProgress = Math.min(scrollPosition / scrollRange, 1);
        const movement = scrollProgress * initialTop; // Move up to 280px total
        const panelTop = Math.max(initialTop - movement, 60); // Keep 60px gap from top for AVIS icons
        
        bookingPanel.style.position = 'fixed';
        bookingPanel.style.top = `${panelTop}px`;
        bookingPanel.style.right = '32px';
        
        // Move AVIS icons along with booking panel - keep bigger gap above booking panel
        if (avisIcons) {
          // Get original position before any changes
          const originalRect = avisIcons.getBoundingClientRect();
          const originalLeft = originalRect.left + window.scrollX;
          
          const avisMovement = scrollProgress * avisInitialTop * 1.1; // Move AVIS icons 10% faster than booking panel
          const avisTop = Math.max(avisInitialTop - avisMovement, panelTop - 120); // Keep 120px gap above booking panel
          
          avisIcons.style.position = 'fixed';
          avisIcons.style.top = `${Math.max(avisTop, 10)}px`; // Never go above 10px from top
          avisIcons.style.left = `${originalLeft}px`; // Keep exact original horizontal position
          avisIcons.style.zIndex = '30';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  return (
    <div className="w-screen bg-[#05050a] min-h-screen flex flex-col">
      <div className="bg-[#05050a] relative w-full max-w-[1728px] mx-auto flex-1 flex flex-col">
        {/* Header/Menu */}
        <div className="absolute left-0 top-0 w-full h-[88px] z-50">
          <ResponsiveHeader />
        </div>

        {/* Vehicle Title */}
        <div className="flex flex-col items-start justify-end gap-2 absolute top-[168px] left-4 md:left-8 lg:left-[200px] w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] lg:w-[1328px]">
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
                  onClick={handleHeartClick}
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

        {/* Main Content Area */}
        <div className="flex flex-col gap-8 lg:gap-20 mt-[280px] px-4 md:px-8 lg:px-[200px] flex-1">
          {/* Mobile/Tablet Layout */}
          <div className="block lg:hidden">
            {/* Vehicle Gallery */}
            <div className="flex flex-col gap-6 mb-8">
              <div 
                className="relative w-full h-[200px] md:h-[300px] bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer" 
                style={{backgroundImage: `url(${vehicleImages[currentImageIndex]})`}}
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length)}
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 px-4 py-2 bg-[#00000080] rounded-lg">
                  <img src="/assets/icons/icon-photo.svg" alt="Photo" className="w-4 h-4" />
                  <span className="font-sf-pro font-medium text-[#F0F0F5] text-xs">
                    {vehicleImages.length}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-stretch items-stretch flex-wrap gap-4 w-full">
                {vehicleImages.slice(1, 5).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index + 1)}
                    className={`flex-1 h-16 md:h-20 bg-cover bg-center rounded-lg transition-opacity hover:opacity-80 ${
                      index === 3 ? 'relative' : ''
                    }`}
                    style={{backgroundImage: `url(${image})`}}
                  >
                    {index === 3 && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-1 text-white">
                          <span className="text-xs md:text-sm font-medium">viac</span>
                          <img src="/assets/icons/icon-photo.svg" alt="More photos" className="w-4 h-4 md:w-6 md:h-6" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile/Tablet Content */}
            <div className="flex flex-col gap-8">
              {/* Description */}
              <div className="flex flex-col gap-6">
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
              <div className="flex flex-col gap-6">
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
              <div className="flex flex-col gap-6">
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
              <div className="flex flex-col gap-4 p-4 md:p-6 w-full bg-[#0F0F14] rounded-2xl">
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
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex flex-col gap-20">
            {/* Single Column Layout - All content in left column */}
            <div className="flex flex-col gap-20 w-[761px]">
                {/* Vehicle Gallery */}
                <div className="flex flex-col gap-8">
                {/* Main Image */}
                <div 
                  className="relative w-[761px] h-[432px] bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer" 
                  style={{backgroundImage: `url(${vehicleImages[0]})`}}
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length)}
                >
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex justify-stretch items-stretch gap-6 w-[761px]">
                  {vehicleImages.slice(1, 5).map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index + 1)}
                      className={`flex-1 h-24 bg-cover bg-center rounded-lg transition-opacity hover:opacity-80 ${
                        index === 3 ? 'relative' : ''
                      }`}
                      style={{backgroundImage: `url(${image})`}}
                    >
                      {index === 3 && (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                          <div className="flex items-center gap-1 text-white">
                            <span className="text-sm font-medium">viac</span>
                            <img src="/assets/icons/icon-photo.svg" alt="More photos" className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-[761px] h-px bg-[#1E1E23]"></div>

              {/* Vehicle Description */}
              <div className="flex flex-col items-stretch gap-10 self-stretch w-full">
                <div className="flex items-center w-[260px] h-4">
                  <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Predstavenie vozidla
                  </div>
                </div>

                <div className="relative w-[719px] h-[274px]">
                  <div className="absolute w-[719px] h-[63px] top-0 left-0">
                    <p className="font-sf-pro font-normal text-[#F0F0F5] text-base leading-[26px] tracking-[0]">
                      Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.
                    </p>
                  </div>
                  
                  <div className="absolute w-[637.51px] h-[37px] top-[120px] left-[57.52px]">
                    <p className="font-sf-pro font-normal text-[#F0F0F5] text-base leading-[26px] tracking-[0]">
                      Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                    </p>
                  </div>
                  
                  <div className="absolute w-[637.51px] h-[89px] top-[185px] left-[57.52px]">
                    <p className="font-sf-pro font-normal text-[#F0F0F5] text-base leading-[26px] tracking-[0]">
                      Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.
                    </p>
                  </div>

                  <div className="absolute w-[28.76px] h-0 top-[191px] left-[9.59px] border-t-2 border-[#E4FF56]"></div>
                  <div className="absolute w-[28.76px] h-0 top-[126px] left-[9.59px] border-t-2 border-[#E4FF56]"></div>
                </div>
              </div>

                {/* Pricing Table */}
                <div className="flex flex-col gap-6 p-8 w-[761px] bg-[#0F0F14] rounded-2xl">
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

              {/* Technical Parameters */}
              <div className="flex flex-col gap-10">
                <div className="flex justify-center items-center gap-2 p-4 h-4">
                  <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Technické parametre
                  </div>
                </div>

                <div className="flex justify-stretch items-stretch gap-4 w-[761px]">
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

              <div className="w-[761px] h-px bg-[#1E1E23]"></div>

              {/* Vehicle Equipment */}
              <div className="flex flex-col gap-10 w-[761px]">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Výbava vozidla
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4 w-[761px]">
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
          </div>
          </div>
        </div>

        {/* Mobile/Tablet Booking Panel - Naša Interaktívna Tabuľka */}
        <div className="block lg:hidden fixed bottom-4 left-4 right-4 z-50">
          <TabulkaObjednavky 
            initialState="default"
            onStateChange={(newState) => console.log('Mobile vehicle booking state:', newState)}
          />
        </div>

        {/* Desktop Booking Panel - Naša Interaktívna Tabuľka */}
        <div className="hidden lg:flex fixed top-[280px] right-8 z-40" id="booking-panel">
          <TabulkaObjednavky 
            initialState="default"
            onStateChange={(newState) => console.log('Vehicle booking state:', newState)}
          />
        </div>

        {/* Included in Price Section */}
        <div id="included-in-price-section" className="flex flex-col gap-2 p-12 relative w-full max-w-[1328px] mx-auto mt-16 lg:mt-24 bg-[#0F0F14] rounded-2xl">
          <div className="flex items-stretch gap-10 self-stretch">
            <div className="relative w-[92px] h-[88px]">
              <div className="absolute w-[88px] h-[88px] top-0 left-0 bg-gradient-to-br from-[#FAFFDC] to-[#D7FF14] rounded-full opacity-20 blur-[40px]"></div>
              <div className="absolute w-[88px] h-[88px] top-0 left-0 bg-white bg-opacity-[0.04] border border-gradient-to-br from-white to-[#D7FF14] rounded-full backdrop-blur-[40px]"></div>
              <div className="absolute w-[55px] h-[55px] top-1 left-[37px] bg-gradient-to-br from-[#FAFFDC] to-[#D7FF14] rounded-full"></div>
              <div className="absolute w-[41.11px] h-[31.21px] top-[29px] left-[26px] bg-white bg-opacity-50 rounded"></div>
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex justify-center items-center gap-2 h-[88px]">
                <div className="relative w-fit font-sf-pro font-bold text-[#F0FF98] text-2xl tracking-[0] leading-7 text-center">
                  V cene je zahrnuté
                </div>
              </div>

              <div className="flex justify-stretch items-stretch gap-24">
                <div className="flex flex-col gap-8 flex-1">
                  {[
                    'Slovenská dialničná známka',
                    'Havaríjne poistenie'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center self-stretch gap-4">
                      <div className="flex gap-2 p-2 bg-[#283002] rounded-full">
                        <div className="relative w-6 h-6">
                          <img src="/assets/icons/icon-check.svg" alt="Check" className="w-6 h-6" />
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-8 flex-1">
                  {[
                    'Dane a poplatky',
                    'Poistenie zodpovednosti za škody'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center self-stretch gap-4">
                      <div className="flex gap-2 p-2 bg-[#283002] rounded-full">
                        <div className="relative w-6 h-6">
                          <img src="/assets/icons/icon-check.svg" alt="Check" className="w-6 h-6" />
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-8 flex-1">
                  {[
                    'Letné a zimné pneumatiky',
                    'Servisné náklady'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center self-stretch gap-4">
                      <div className="flex gap-2 p-2 bg-[#283002] rounded-full">
                        <div className="relative w-6 h-6">
                          <img src="/assets/icons/icon-check.svg" alt="Check" className="w-6 h-6" />
                        </div>
                        <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base tracking-[0] leading-6">
                          {item}
                        </div>
                      </div>
                    </div>
                  ))}
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