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

  // Použitie nášho optimalizovaného responzívneho systému
  const { frameLeft, tableLeft, frameWidth, tableWidth, frameHeight, containerWidth, breakpoint, isStackedLayout } = useResponsiveLayout();


  
  const vehicleImages = [
    '/figma-assets/n-h-ad-vozidla-1.png',
    '/figma-assets/n-h-ad-vozidla-10.png', 
    '/figma-assets/n-h-ad-vozidla-12.png',
    '/figma-assets/n-h-ad-vozidla-14.png',
    '/figma-assets/n-h-ad-vozidla-4.png'
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
      <div 
        className="bg-[#05050a] relative flex-1 flex flex-col mx-auto"
        style={{ 
          width: containerWidth
        }}
      >
        {/* Header/Menu */}
        <div className="absolute left-0 top-0 w-full h-[88px] z-50">
          <ResponsiveHeader />
        </div>

        {/* Vehicle Title */}
        <div 
          className="flex flex-col items-start justify-end gap-2 absolute top-[168px]"
          style={{
            left: frameLeft,
            width: frameWidth
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
        <div 
          className="flex flex-col gap-8 mt-[280px] flex-1"
          style={{
            paddingLeft: frameLeft,
            paddingRight: isStackedLayout ? frameLeft : 0
          }}
        >
          {/* Mobile/Tablet Layout */}
          <div className={`${isStackedLayout ? 'block' : 'hidden'}`}>
            {/* Vehicle Gallery */}
            <div className="flex flex-col gap-6 mb-8">
              <div 
                className="relative bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer mx-auto self-stretch" 
                style={{
                  backgroundImage: `url(${vehicleImages[currentImageIndex]})`,
                  width: frameWidth,
                  height: frameHeight
                }}
                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length)}
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 px-4 py-2 bg-[#00000080] rounded-lg">
                  <img src="/assets/icons/icon-photo.svg" alt="Photo" className="w-4 h-4" />
                  <span className="font-sf-pro font-medium text-[#F0F0F5] text-xs">
                    {vehicleImages.length}
                  </span>
                </div>
              </div>
              
              {/* Thumbnail gallery - len pre tablet (744px), nie pre mobile (360px) */}
              {breakpoint !== '360' && (
                <div className="flex justify-stretch items-stretch flex-wrap gap-4 mx-auto" style={{ width: frameWidth }}>
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
              )}

              {/* Mobile/Tablet Booking Panel - Under Images */}
              <div className="block mt-8">
                <TabulkaObjednavky 
                  initialState="default"
                />
              </div>
            </div>

            {/* Mobile/Tablet Content */}
            <div className="flex flex-col gap-8 mx-auto" style={{ width: frameWidth }}>
              {/* Description */}
              <div className="flex flex-col gap-6">
                <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Predstavenie vozidla
                </div>
                <div className="text-[#F0F0F5] text-base leading-6">
                  <p className="mb-4">Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.</p>
                  <p className="mb-4">Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.</p>
                  <p>Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atrakt��vny.</p>
                </div>
              </div>

              {/* Technical Parameters - Mobile/Tablet */}
              <div className="flex flex-col gap-6">
                <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Technické parametre
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Výbava vozidla
                </div>
                <div className="flex items-center flex-wrap gap-3">
                  {[
                    'Bluetooth', 'USB vstup', 'Klimatizácia', 'GPS', 'Tempomat', '4×4',
                    'Lorem ipsum', 'Parkovacie senzory', 'Apple carplay', 'Lorem ipsum',
                    'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum', 'Lorem ipsum'
                  ].map((feature, index) => (
                    <div key={index} className="flex justify-center items-center gap-2 px-3 py-1 h-7 bg-[#1E1E23] rounded-lg">
                      <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                        {feature}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Table - Mobile/Tablet */}
              <div className="flex flex-col gap-4 p-6 bg-[#0F0F14] rounded-2xl" style={{ width: frameWidth }}>
                <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Cenové relácie
                </div>
                <div className="flex flex-col items-start relative self-stretch w-full">
                  {/* Header */}
                  <div className="flex h-10 items-center justify-between px-0 py-3 relative self-stretch w-full border-b border-[#28282D]">
                    <div className="flex w-32 items-center gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Dní
                      </div>
                    </div>
                    <div className="flex w-24 items-center justify-end gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                        Km/deň
                      </div>
                    </div>
                    <div className="flex w-24 items-center justify-end gap-1 p-1">
                      <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                        Cena/deň
                      </div>
                    </div>
                  </div>
                  {/* Pricing Rows */}
                  {[
                    { days: '0–1', km: '300', price: '200 €' },
                    { days: '2–3', km: '250', price: '175 €' },
                    { days: '4–7', km: '210', price: '150 ��' },
                    { days: '8–14', km: '170', price: '130 €' },
                    { days: '15–22', km: '150', price: '120 €' },
                    { days: '23–30', km: '130', price: '110 €' },
                    { days: '31+', km: '115', price: '100 €' }
                  ].map((row, index) => (
                    <div key={index} className="flex h-10 items-center justify-between px-0 py-3 relative self-stretch w-full border-b border-[#28282D]">
                      <div className="flex w-32 items-center gap-1 p-1">
                        <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                          {row.days}
                        </div>
                      </div>
                      <div className="flex w-24 items-center justify-end gap-1 p-1">
                        <div className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
                          {row.km}
                        </div>
                      </div>
                      <div className="flex w-24 items-center justify-end gap-1 p-1">
                        <div className="relative w-fit font-sf-pro font-semibold text-[#F0F0F5] text-sm text-right tracking-[0] leading-5 whitespace-nowrap">
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
          <div className={`${!isStackedLayout ? 'flex' : 'hidden'} gap-20`}>
            {/* Vehicle Frame - ľavá strana */}
            <div 
              className="flex flex-col gap-8"
              style={{ width: frameWidth }}
            >
                {/* Vehicle Gallery */}
                <div className="flex flex-col gap-8">
                {/* Main Image */}
                <div 
                  id="main-vehicle-image"
                  className="relative bg-cover bg-center rounded-2xl overflow-hidden cursor-pointer"
                  style={{
                    backgroundImage: `url(${vehicleImages[0]})`,
                    width: frameWidth,
                    height: frameHeight
                  }}
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % vehicleImages.length)}
                >
                  {/* Debug info - iba pre testovanie */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-10">
                    ID: main-vehicle-image
                  </div>
                
                </div>
                
                {/* Thumbnail Gallery */}
                <div className="flex justify-stretch items-stretch gap-6" style={{ width: frameWidth }}>
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

              <div className="h-px bg-[#1E1E23]" style={{ width: frameWidth }}></div>

              {/* Vehicle Description */}
              <div className="flex flex-col items-stretch gap-10 self-stretch w-full">
                <div className="flex items-center w-[260px] h-4">
                  <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                    Predstavenie vozidla
                  </div>
                </div>

                <div className="space-y-10">
                  <h2 className="text-xl font-semibold text-[#F4D03F]">
                    Predstavenie vozidla
                  </h2>
                  
                  <div className="space-y-6 text-white/80 text-base leading-relaxed">
                    <p>
                      Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým prírastkom do flotily - BMW M440i xDrive. Tento výnimočný model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom, čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za volant.
                    </p>
                    
                    <p>
                      Čo robí tento model ešte výnimočnejším, je jeho matná šedá farba. Táto farba dodáva vozidlu elegantný a sofistikovaný vzhľad, ktorý zaujme na každej ceste.
                    </p>
                    
                    <p>
                      Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a moderné technológie, BMW M440i je jednoznačne tou správnou voľbou. Moderné technológie a prvotriedne materiály vytvárajú interiér, ktorý je rovnako pohodlný ako atraktívny.
                    </p>
                  </div>
                </div>
              </div>

                {/* Pricing Table */}
                <div className="flex flex-col gap-6 p-8 bg-[#0F0F14] rounded-2xl" style={{ width: frameWidth }}>
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

                <div className="flex justify-stretch items-stretch gap-4" style={{ width: frameWidth }}>
                  {/* Left Column */}
                  <div className="flex flex-col gap-2 flex-1">
                    {[
                      { icon: 'icon-karoseria.svg', label: 'Karoséria:', value: 'SUV', color: '#BEBEC3' },
                      { icon: 'icon-dvere.svg', label: 'Počet dver��:', value: '4+1', color: '#BEBEC3' },
                      { icon: 'icon-vykon.svg', label: 'Výkon:', value: '275 kw', color: '#BEBEC3' },
                      { icon: 'icon-objem.svg', label: 'Objem valcov:', value: '2998 cm3', color: '#AAAAAF' },
                      { icon: 'icon-spotreba.svg', label: 'Spotreba:', value: '5.4l/100km', color: '#BEBEC3' }
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

                  {/* Right Column */}
                  <div className="flex flex-col gap-2 flex-1">
                    {[
                      { icon: 'icon-palivo.svg', label: 'Palivo:', value: 'Benzín', color: '#BEBEC3' },
                      { icon: 'icon-prevodovka.svg', label: 'Prevodovka:', value: 'Automatická', color: '#BEBEC3' },
                      { icon: 'icon-nahon.svg', label: 'Náhon:', value: '4×4', color: '#BEBEC3' },
                      { icon: 'icon-calendar.svg', label: 'Rok výroby:', value: '2016', color: '#BEBEC3' },
                      { icon: 'icon-km.svg', label: 'Nájazd km:', value: '91000 km', color: '#BEBEC3' }
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
                </div>
              </div>

              <div className="h-px bg-[#1E1E23]" style={{ width: frameWidth }}></div>

              {/* Vehicle Equipment */}
              <div className="flex flex-col gap-10" style={{ width: frameWidth }}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-center items-center gap-2">
                    <div className="relative w-fit font-sf-pro font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                      Výbava vozidla
                    </div>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-4" style={{ width: frameWidth }}>
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
            
            {/* Desktop Booking Panel - pravá strana */}
            <div 
              className="flex flex-col"
              style={{ width: tableWidth }}
            >
              <TabulkaObjednavky 
                initialState="default"
              />
            </div>
          </div>

        {/* Included in Price Section */}
        <div 
          id="included-in-price-section" 
          className="flex flex-col gap-2 p-12 relative mt-24 rounded-2xl mx-auto"
          style={{ width: containerWidth }}
        >
          <div className="flex items-stretch gap-10 self-stretch bg-[#0F0F14]">
            <div className="relative w-[92px] h-[88px]">
              <img src="/assets/icons/icon-check-3d.svg" alt="Check 3D" className="w-[92px] h-[88px]" />
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
                    'Slovenská dialni��ná známka',
                    'Havaríjne poistenie'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center self-stretch gap-4">
                      <div className="flex gap-2 p-2 bg-[#283002] rounded-full">
                        <div className="relative w-6 h-6">
                          <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
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
                          <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
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
                          <img src="/assets/icons/icon-check-24px.svg" alt="Check" className="w-6 h-6" />
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

        {/* Predstavenie vozidla - pre stacked layout pod tabulkou */}
        {isStackedLayout && (
          <div className="w-full px-8 py-12 bg-[#05050a]">
            <div className="space-y-10 mx-auto" style={{ width: frameWidth }}>
              <h2 className="text-xl font-semibold text-[#F4D03F]">
                Predstavenie vozidla
              </h2>
              
              <div className="space-y-6 text-white/80 text-base leading-relaxed">
                <p>
                  Zažite skutočnú jazdu plnú luxusu a výkonu s naším novým
                  prírastkom do flotily - BMW M440i xDrive. Tento výnimočný
                  model z roku 2022 a má výkon 275 kW. Je poháňaný benzínom,
                  čo vám zaručuje adrenalínovú jazdu vždy, keď sadnete za
                  volant.
                </p>
                
                <p>
                  Čo robí tento model ešte výnimočnejším, je jeho matná šedá
                  farba. Táto farba dodáva vozidlu elegantný a sofistikovaný
                  vzhľad, ktorý zaujme na každej ceste.
                </p>
                
                <p>
                  Ak hľadáte auto na prenájom, ktoré kombinuje štýl, výkon a
                  moderné technológie, BMW M440i je jednoznačne tou správnou
                  voľbou. Moderné technológie a prvotriedne materiály
                  vytvárajú interiér, ktorý je rovnako pohodlný ako
                  atraktívny.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Responzívny Footer - kompletná sekcia ako na homepage */}
        <ResponsiveFooter />
      </div>
    </div>
  );
}
