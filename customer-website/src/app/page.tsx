import React from "react";
import { HeaderSection } from "../components/anima/sections/HeaderSection/HeaderSection";
import { HeroSection } from "../components/anima/sections/HeroSection/HeroSection";
import { FeaturedItemsSection } from "../components/anima/sections/FeaturedItemsSection/FeaturedItemsSection";
import { BrandLogosSection } from "../components/anima/sections/BrandLogosSection/BrandLogosSection";
import { ContactSection } from "../components/anima/sections/ContactSection/ContactSection";
import { ChatButton } from "../components/anima/sections/ChatButton/ChatButton";

export default function Home() {
  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">
      {/* Header */}
      <HeaderSection />
      
      {/* Main content */}
      <main className="flex flex-col gap-16 py-8">
        {/* Hero Section */}
        <section className="px-4 md:px-8">
          <HeroSection />
        </section>
        
        {/* Featured Items Section */}
        <section className="px-4 md:px-8">
          <FeaturedItemsSection />
        </section>
        
        {/* Brand Logos Section */}
        <section className="px-4 md:px-8">
          <BrandLogosSection />
        </section>
        
        {/* Contact Section with FAQ */}
        <section className="px-4 md:px-8">
          <ContactSection />
        </section>
      </main>
      
      {/* Chat Button - Fixed position */}
      <ChatButton />
    </div>
  );
}