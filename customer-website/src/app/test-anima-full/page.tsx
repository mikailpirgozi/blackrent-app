import React from "react";

// Import všetkých Anima komponentov
import { ContactSection } from "@/components/anima/sections/ContactSection/ContactSection";
import { FeaturedItemsSection } from "@/components/anima/sections/FeaturedItemsSection/FeaturedItemsSection";
import { GallerySection } from "@/components/anima/sections/GallerySection/GallerySection";
import { HeroSection } from "@/components/anima/sections/HeroSection/HeroSection";
import { ReviewsSection } from "@/components/anima/sections/ReviewsSection/ReviewsSection";

export default function TestAnimaFullPage() {
  const noteCards = [];

  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden">
      {/* Background blur effect */}
      <div className="absolute w-[400px] md:w-[600px] lg:w-[800px] h-[400px] md:h-[600px] lg:h-[800px] top-0 left-1/2 transform -translate-x-1/2 bg-[#1e1e23] rounded-[200px] md:rounded-[300px] lg:rounded-[400px] blur-[150px] md:blur-[200px] lg:blur-[250px] opacity-50 z-0" />
      
      {/* Main content */}
      <div className="relative z-10">
        <FeaturedItemsSection />
        <GallerySection />
        <ReviewsSection />
        <ContactSection />
      </div>

      {/* Note cards */}
      {noteCards.map((card, index) => (
        <div key={`note-card-${index}`} className={card.className}>
          {card.content}
        </div>
      ))}
    </div>
  );
}
