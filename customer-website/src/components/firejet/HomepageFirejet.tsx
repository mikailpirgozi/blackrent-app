'use client'

import HeaderFirejet from './HeaderFirejet'
import HeroSectionFirejet from './HeroSectionFirejet'
import VehicleGridFirejet from './VehicleGridFirejet'
import BrandLogosFirejet from './BrandLogosFirejet'
import ReviewsSectionFirejet from './ReviewsSectionFirejet'
import FAQSectionFirejet from './FAQSectionFirejet'
import FooterFirejet from './FooterFirejet'

export default function HomepageFirejet({
  className = "",
}: HomepageFirejetProps) {
  return (
    <div className={`flex w-full items-start leading-[normal] ${className}`}>
      <div className="font-poppins flex h-full w-full flex-col overflow-clip bg-blackrent-dark">
        
        {/* Header s logom a navigáciou */}
        <HeaderFirejet />
        
        {/* Hero sekcia s hlavným textom */}
        <HeroSectionFirejet />
        
        {/* Grid vozidiel */}
        <VehicleGridFirejet />
        
        {/* Logá značiek áut */}
        <BrandLogosFirejet />
        
        {/* Recenzie zákazníkov */}
        <ReviewsSectionFirejet />
        
        {/* Často kladené otázky */}
        <FAQSectionFirejet />
        
        {/* Footer */}
        <FooterFirejet />
        
      </div>
    </div>
  )
}

interface HomepageFirejetProps {
  className?: string;
}
