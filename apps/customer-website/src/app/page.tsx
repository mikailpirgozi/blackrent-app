import React from "react";
import { ResponsiveHeader } from "../components/shared/ResponsiveHeader";
import { FeaturedItemsSection } from "../components/anima/sections/FeaturedItemsSection/FeaturedItemsSection";
import { ReviewsSection } from "../components/anima/sections/ReviewsSection/ReviewsSection";
import { ResponsiveFooter } from "../components/shared/ResponsiveFooter";


export default function Home() {
  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">
      {/* Responzívny Header */}
      <ResponsiveHeader />
      
      {/* Main content */}
      <main className="flex flex-col gap-16 py-8">

        {/* Featured Items Section */}
        <section className="px-4 md:px-8">
          <FeaturedItemsSection />
        </section>
        

        
        {/* Reviews Section */}
        <ReviewsSection />
      </main>

      {/* Responzívny Footer */}
      <ResponsiveFooter />

    </div>
  );
}