"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import ButtonSecondary from '../ButtonSecondary';

interface MenuProps {
  /** Callback function to handle burger menu state changes */
  onBurgerMenuToggle?: (isOpen: boolean) => void;
}

export default function Menu({ onBurgerMenuToggle }: MenuProps) {
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  const handleBurgerClick = () => {
    const newState = !isBurgerMenuOpen;
    setIsBurgerMenuOpen(newState);
    onBurgerMenuToggle?.(newState);
  };
  return (
    <div className="box-border content-stretch flex items-center justify-between px-[32px] py-0 relative size-full h-[88px]" data-name="Menu" data-node-id="18225:11536">

      {/* BLACKRENT LOGO */}
      <Link href="/">
        <div className="h-[32px] overflow-clip relative shrink-0 w-[214.4px]" data-name="Blackrent-logo" data-node-id="18225:11537">
          <Image alt="BlackRent Logo" className="block max-w-none size-full" src="/assets/brands/blackrent-logo-white.svg" width={214} height={32} />
        </div>
      </Link>

      {/* NAVIGATION MENU */}
      <div className="hidden lg:flex content-stretch items-center justify-center relative shrink-0" data-name="Kategorie v menu" data-node-id="18225:11566">
        <div className="flex flex-row items-center self-stretch">
          <div className="content-stretch flex gap-[4px] h-full items-center justify-center relative shrink-0" data-node-id="18225:11567">
            <Link href="/ponuka" className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[8px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" data-name="Sekcie v menu black" data-node-id="18225:11568">
              <div className="css-fds3rt flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="I18225:11568;1291:5214">
                <p className="leading-[24px] whitespace-pre">Ponuka vozidiel</p>
              </div>
            </Link>
            <Link href="/sluzby" className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[8px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" data-name="Sekcie v menu black" data-node-id="18225:11569">
              <div className="css-fds3rt flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="I18225:11569;1291:5214">
                <p className="leading-[24px] whitespace-pre">Služby</p>
              </div>
            </Link>
            <Link href="/store" className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[8px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" data-name="Sekcie v menu black" data-node-id="18225:11570">
              <div className="css-fds3rt flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="I18225:11570;1291:5214">
                <p className="leading-[24px] whitespace-pre">Store</p>
              </div>
            </Link>
            <Link href="/o-nas" className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[8px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" data-name="Sekcie v menu black" data-node-id="18225:11571">
              <div className="css-fds3rt flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="I18225:11571;1291:5214">
                <p className="leading-[24px] whitespace-pre">O nás</p>
              </div>
            </Link>
            <Link href="/kontakt" className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center p-[8px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" data-name="Sekcie v menu black" data-node-id="18225:11572">
              <div className="css-fds3rt flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="I18225:11572;1291:5214">
                <p className="leading-[24px] whitespace-pre">Kontakt</p>
              </div>
            </Link>
          </div>
        </div>
        <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0" data-node-id="18225:11573">
          <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[16px] py-[12px] relative rounded-[8px] shrink-0" data-name="Store" data-node-id="18225:11574">
            <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Ikony 25" data-node-id="I18225:11574;4105:10232">
              <div className="absolute left-[2px] size-[20px] top-[2px]" data-name="Union" data-node-id="I18225:11574;4105:10232;7955:17199">
                <Image alt="BlackRent Logo" className="block max-w-none size-full" src="/assets/icons/union.svg" width={214} height={32} />
              </div>
            </div>
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d4d4e0] text-[14px] text-nowrap text-right" data-node-id="I18225:11574;4105:10233">
              <p className="leading-[24px] whitespace-pre">SK</p>
            </div>
          </div>
          <Link href="/login">
            <ButtonSecondary
              iconPath="/assets/icons/login-yellow.svg"
              iconAlt="Prihlásiť sa"
              text="Prihlásiť sa"
            />
          </Link>
        </div>
      </div>

      {/* Burger menu for 1024px or less */}
      <button
        className="block lg:hidden relative w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleBurgerClick}
        aria-label={isBurgerMenuOpen ? "Zavrieť menu" : "Otvoriť menu"}
      >
        <Image
          alt={"Burger menu"}
          src={"/assets/icons/burger-yellow.svg"}
          width={24}
          height={24}
        />
      </button>
    </div>
  );
}
