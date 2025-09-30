"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ButtonSecondary from '../ButtonSecondary';

interface BurgerMenuProps {
  /** Whether the burger menu is open */
  isOpen?: boolean;
  /** Callback function when menu should be closed */
  onClose?: () => void;
}

export default function BurgerMenu({ isOpen = true, onClose }: BurgerMenuProps) {
//   const handleLinkClick = () => {
//     onClose?.();
//   };

  if (!isOpen) return null;

  return (
    // <div className="lg:hidden fixed inset-0 z-50 bg-[#05050a]" data-node-id="4224:11821">
      <div className="bg-[#05050a] box-border content-stretch flex flex-col gap-[16px] items-center justify-center pb-[240px] pt-[160px] px-0 relative rounded-bl-[40px] rounded-br-[40px] size-full">
        <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0" data-node-id="10945:24580">
          
          {/* Navigation Links */}
          <Link 
            href="/vozidla" 
            className="box-border content-stretch flex gap-[16px] h-[40px] items-center justify-center px-[24px] py-[16px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" 
            data-node-id="10945:24581"
            // onClick={handleLinkClick}
          >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[16px] text-center text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="10945:24582">
              <p className="leading-[24px] whitespace-pre">Ponuka vozidiel</p>
            </div>
          </Link>

          <Link 
            href="/store" 
            className="box-border content-stretch flex gap-[16px] h-[40px] items-center justify-center px-[24px] py-[16px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" 
            data-node-id="10945:24583"
            // onClick={handleLinkClick}
          >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[16px] text-center text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="10945:24584">
              <p className="leading-[24px] whitespace-pre">Store</p>
            </div>
          </Link>

          <Link 
            href="/sluzby" 
            className="box-border content-stretch flex gap-[16px] h-[40px] items-center justify-center px-[24px] py-[16px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" 
            data-node-id="10945:24585"
            // onClick={handleLinkClick}
          >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[16px] text-center text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="10945:24586">
              <p className="leading-[24px] whitespace-pre">Služby</p>
            </div>
          </Link>

          <Link 
            href="/o-nas" 
            className="box-border content-stretch flex gap-[16px] h-[40px] items-center justify-center px-[24px] py-[16px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" 
            data-node-id="10945:24587"
            // onClick={handleLinkClick}
          >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[16px] text-center text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="10945:24588">
              <p className="leading-[24px] whitespace-pre">O nás</p>
            </div>
          </Link>

          <Link 
            href="/kontakt" 
            className="box-border content-stretch flex gap-[16px] h-[40px] items-center justify-center px-[24px] py-[16px] relative shrink-0 hover:bg-[#1a1a1a] transition-colors rounded-[4px]" 
            data-node-id="10945:24589"
            // onClick={handleLinkClick}
          >
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[16px] text-center text-nowrap hover:text-[#d7ff14] transition-colors" data-node-id="10945:24590">
              <p className="leading-[24px] whitespace-pre">Kontakt</p>
            </div>
          </Link>

          {/* Language Selector */}
          <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center px-[16px] py-[12px] relative rounded-[8px] shrink-0" data-name="Store" data-node-id="10945:24591">
            <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Ikony 25" data-node-id="I10945:24591;4105:10232">
              <div className="absolute left-[2px] size-[20px] top-[2px]" data-name="Union" data-node-id="I10945:24591;4105:10232;7955:17199">
                <Image alt="Language" src="/assets/icons/union.svg" width={20} height={20} className="block max-w-none size-full" />
              </div>
            </div>
            <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#a0a0a5] text-[14px] text-nowrap text-right" data-node-id="I10945:24591;4105:10233">
              <p className="leading-[24px] whitespace-pre">SK</p>
            </div>
          </div>

          {/* Login Button */}
          <div className="mt-2">
            <ButtonSecondary
              iconPath="/assets/icons/login-yellow.svg"
              iconAlt="Prihlásiť sa"
              text="Prihlásiť sa"
              className="bg-[#141900] hover:bg-[#1f2600]"
            //   onClick={handleLinkClick}
            />
          </div>
        </div>
      </div>
     // </div>
  );
}
