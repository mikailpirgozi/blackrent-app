"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useWindowWidth } from "../../../hooks/useWindowWidth";

const navigationItems = [
  { label: "Ponuka vozidiel", href: "/vozidla" },
  { label: "Služby", href: "#" },
  { label: "Store", href: "#" },
  { label: "O nás", href: "#" },
  { label: "Kontakt", href: "#" }
] as const;

export const ResponsiveHeader = (): JSX.Element => {
  const screenWidth = useWindowWidth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header (360px) */}
      {screenWidth < 744 && (
        <>
          <header className="flex w-[360px] h-16 items-center justify-between px-4 py-0 relative bg-[#05050A]">
            {/* BlackRent Logo */}
            <Link href="/" className="relative w-[134px] h-5 cursor-pointer">
              <img
                className="w-full h-full brightness-0 invert"
                alt="BlackRent Logo"
                src="/assets/brands/blackrent-logo.svg"
              />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-6 h-6 cursor-pointer"
            >
              <img
                className="w-6 h-6"
                alt="Menu"
                src="/assets/misc/icon-menu-24px.svg"
              />
            </button>
          </header>
          
          {/* Mobile Menu Overlay (360px) */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-[#05050A] z-50 flex flex-col">
              {/* Header in overlay */}
              <header className="flex w-[360px] h-16 items-center justify-between px-4 py-0 relative bg-[#05050A]">
                <Link href="/" className="relative w-[134px] h-5 cursor-pointer">
                  <img
                    className="w-full h-full brightness-0 invert"
                    alt="BlackRent Logo"
                    src="/assets/brands/blackrent-logo.svg"
                  />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative w-6 h-6 cursor-pointer"
                >
                  <img
                    className="w-6 h-6"
                    alt="Close"
                    src="/assets/misc/icon-menu-24px.svg"
                  />
                </button>
              </header>
              
              {/* Menu Content */}
              <div className="flex flex-col items-center gap-2 pt-[133px]">
                {/* Navigation Items */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="/vozidla" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Ponuka vozidiel
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Store
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Služby
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      O nás
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Kontakt
                    </Link>
                  </div>
                  
                  {/* Language selector */}
                  <div className="flex flex-row justify-center items-center gap-2 px-4 py-3 h-10 rounded-lg">
                    <div className="relative w-6 h-6">
                      <img
                        className="w-6 h-6"
                        alt="World icon"
                        src="/assets/misc/icon-world-24px.svg"
                      />
                    </div>
                    <div className="font-medium text-[#A0A0A5] text-sm text-right font-sf-pro leading-6 whitespace-nowrap">
                      SK
                    </div>
                  </div>
                  
                  {/* Login button */}
                  <button className="flex flex-row justify-center items-center gap-1.5 pl-5 pr-6 py-3 h-10 bg-[#141900] rounded-[99px] hover:bg-[#1a1f00]">
                    <img
                      className="relative w-6 h-6"
                      alt="Person icon"
                      src="/assets/misc/icon-person-yellow-24px.svg"
                    />
                    <div className="font-medium text-[#d7ff14] text-sm font-sf-pro leading-6 whitespace-nowrap">
                      Prihlásiť sa
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tablet Header (744px) */}
      {screenWidth >= 744 && screenWidth < 1440 && (
        <>
          <header className="flex w-[744px] h-16 items-center justify-between px-8 py-0 relative bg-[#05050A]">
            {/* BlackRent Logo */}
            <Link href="/" className="relative w-[160.8px] h-6 cursor-pointer">
              <img
                className="w-full h-full brightness-0 invert"
                alt="BlackRent Logo"
                src="/assets/brands/blackrent-logo.svg"
              />
            </Link>

            {/* Tablet Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative w-6 h-6 cursor-pointer"
            >
              <img
                className="w-6 h-6"
                alt="Menu"
                src="/assets/misc/icon-menu-24px.svg"
              />
            </button>
          </header>
          
          {/* Tablet Menu Overlay (744px) */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 bg-[#05050A] z-50 flex flex-col">
              {/* Header in overlay */}
              <header className="flex w-[744px] h-16 items-center justify-between px-8 py-0 relative bg-[#05050A]">
                <Link href="/" className="relative w-[160.8px] h-6 cursor-pointer">
                  <img
                    className="w-full h-full brightness-0 invert"
                    alt="BlackRent Logo"
                    src="/assets/brands/blackrent-logo.svg"
                  />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative w-6 h-6 cursor-pointer"
                >
                  <img
                    className="w-6 h-6"
                    alt="Close"
                    src="/assets/misc/icon-menu-24px.svg"
                  />
                </button>
              </header>
              
              {/* Menu Content with rounded bottom */}
              <div className="bg-[#05050A] rounded-b-[40px] flex flex-col items-center gap-4 pt-[160px] pb-[240px]">
                {/* Navigation Items */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="/vozidla" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Ponuka vozidiel
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Store
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Služby
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      O nás
                    </Link>
                  </div>
                  <div className="flex flex-row justify-center items-center gap-4 px-6 py-4 h-10">
                    <Link href="#" className="font-medium text-[#A0A0A5] text-base text-center font-sf-pro leading-6 whitespace-nowrap hover:text-white transition-colors">
                      Kontakt
                    </Link>
                  </div>
                  
                  {/* Language selector */}
                  <div className="flex flex-row justify-center items-center gap-2 px-4 py-3 h-10 rounded-lg">
                    <div className="relative w-6 h-6">
                      <img
                        className="w-6 h-6"
                        alt="World icon"
                        src="/assets/misc/icon-world-24px.svg"
                      />
                    </div>
                    <div className="font-medium text-[#A0A0A5] text-sm text-right font-sf-pro leading-6 whitespace-nowrap">
                      SK
                    </div>
                  </div>
                  
                  {/* Login button */}
                  <button className="flex flex-row justify-center items-center gap-1.5 pl-5 pr-6 py-3 h-10 bg-[#141900] rounded-[99px] hover:bg-[#1a1f00]">
                    <img
                      className="relative w-6 h-6"
                      alt="Person icon"
                      src="/assets/misc/icon-person-yellow-24px.svg"
                    />
                    <div className="font-medium text-[#d7ff14] text-sm font-sf-pro leading-6 whitespace-nowrap">
                      Prihlásiť sa
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Desktop Header (1440px and up) */}
      {screenWidth >= 1440 && (
        <header className={`flex items-center justify-between px-8 py-0 relative bg-[#05050A] ${
          screenWidth >= 1728 ? 'w-[1728px] h-[88px]' : 'w-full h-[88px]'
        }`}>
          {/* BlackRent Logo */}
          <Link href="/" className="relative w-[214.4px] h-8 cursor-pointer">
            <img
              className="w-full h-full brightness-0 invert"
              alt="BlackRent Logo"
              src="/assets/brands/blackrent-logo.svg"
            />
          </Link>

          {/* Navigation Menu */}
          <nav className="inline-flex items-center justify-center relative flex-[0_0_auto]">
            <div className="inline-flex items-center justify-center gap-2 relative self-stretch flex-[0_0_auto]">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="inline-flex h-10 items-center justify-center gap-2 p-2 relative flex-[0_0_auto]"
                >
                  <div className="relative w-fit font-medium text-[#bebec3] text-sm leading-6 font-sf-pro tracking-[0] whitespace-nowrap hover:text-white transition-colors">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto] ml-8">
              {/* Language selector */}
              <button className="inline-flex h-10 items-center justify-center gap-2 px-4 py-3 relative flex-[0_0_auto] rounded-lg hover:bg-transparent">
                <div className="relative w-6 h-6">
                  <img
                    className="w-6 h-6"
                    alt="World icon"
                    src="/assets/misc/icon-world-24px.svg"
                  />
                </div>
                <div className="relative w-fit font-sf-pro font-medium text-[#bebec3] text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
                  SK
                </div>
              </button>

              {/* Login button */}
              <button className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative flex-[0_0_auto] bg-[#141900] rounded-[99px] hover:bg-[#1a1f00]">
                <img
                  className="relative w-6 h-6"
                  alt="Person icon"
                  src="/assets/misc/icon-person-yellow-24px.svg"
                />
                <div className="font-medium text-[#d7ff14] text-sm relative w-fit font-sf-pro tracking-[0] leading-6 whitespace-nowrap">
                  Prihlásiť sa
                </div>
              </button>
            </div>
          </nav>
        </header>
      )}
    </>
  );
};
