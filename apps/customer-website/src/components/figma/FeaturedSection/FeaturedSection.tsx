"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

import LeftPicsLarge from './LeftPicsLarge';
import RightPicsLarge from './RightPicsLarge';

import LeftPicsMedium from './LeftPicsMedium';
import RightPicsMedium from './RightPicsMedium';

import ButtonLanding from './ButtonLanding';

interface FeaturedSectionProps {
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
  /** Optional custom className */
  className?: string;
}

export default function FeaturedSection({
  title = "Autá pre každodennú potrebu, aj nezabudnuteľný zážitok",
  description = "Združujeme desiatky preverených autopožičovní na slovensku s ponukou vyše 1000+ vozidiel",
  className = ""
}: FeaturedSectionProps) {
  return (
    <div className={`content-stretch flex flex-row items-start justify-center md:justify-between relative size-full px-0 ${className}`} data-node-id="18218:9991">

      {/* Left Car Images Grid For Large Screens */}

      <div className="hidden 2xl:ml-[0] xl:ml-[-56px] md:grid grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-node-id="18218:9992">
        <div className="hidden xl:grid">
          <LeftPicsLarge />
        </div>
        <div className="grid xl:hidden md:ml-[-44px] lg:ml-0">
          <LeftPicsMedium />
        </div>
      </div>


      {/* Center Content */}
      <div className="box-border content-stretch flex flex-col gap-[48px] items-center pb-0 xl:pt-[32px] px-0 relative shrink-0 w-full xs:w-[328px] sm:w-[420px] lg:w-[600px] xl:w-[800px] 2xl:w-[928px]" data-node-id="18218:9998">
        <div className="content-stretch flex flex-col gap-[32px] items-center leading-[0] relative shrink-0 text-center w-full" data-node-id="18218:9999">

          {/* Main Title */}
          <div className="flex flex-col font-sfpro font-medium h-auto justify-end relative shrink-0 text-[#f0ff98] text-[18px] md:text-[24px] lg:text-[36px] xl:text-[48px] 2xl:text-[56px] w-full xs:w-[328px] sm:w-[420px] lg:w-[600px] xl:w-[800px] 2xl:w-[928px]" data-node-id="18218:10000" style={{ fontVariationSettings: "'wdth' 132" }}>
            <p className="leading-[32px] xl:leading-[64px]">{title}</p>
          </div>

          {/* Description */}
          <div className="flex flex-col font-poppins justify-end not-italic relative shrink-0 text-[#c8c8cd] text-[14px] md:text-[14px] w-full lg:w-[562px]" data-node-id="18218:10001">
            <p className="leading-[20px] whitespace-pre-line">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="content-stretch flex flex-col sm:flex-row gap-[16px] sm:gap-[24px] items-center justify-center relative shrink-0 w-full" data-node-id="18218:10002">

          {/* Primary Button - Ponuka vozidiel */}
          <ButtonLanding
            text="Ponuka vozidiel"
            iconPath="/assets/icons/arrow-right.svg"
            iconAlt="Arrow right"
          />

          {/* Secondary Button - Naše služby */}
          <div className='hidden lg:block'>
            <Link
              href="/sluzby"
              className="backdrop-blur-[20px] backdrop-filter bg-[#28282d] box-border content-stretch flex gap-[10px] h-[40px] items-center px-[24px] py-[4px] relative rounded-[99px] shrink-0 hover:bg-[#3a3a3f] transition-colors"
              data-name="Landing page button"
              data-node-id="18218:10004"
            >
              <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#f0f0f5] text-[14px] text-nowrap" data-node-id="I18218:10004;10399:20981">
                <p className="leading-[32px] whitespace-pre">Naše služby</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Car Images Grid For Large Screens */}
      <div className="hidden 2xl:mr-[0] xl:mr-[-56px] md:grid grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-node-id="18218:10005">
        <div className="hidden xl:grid">
          <RightPicsLarge />
        </div>
        <div className="grid xl:hidden md:mr-[-44px] lg:mr-0">
          <RightPicsMedium />
        </div>
      </div>

    </div>
  );
}
