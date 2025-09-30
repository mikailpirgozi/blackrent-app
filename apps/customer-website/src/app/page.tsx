"use client";

import React, { useState } from "react";
import Header from "../components/figma/Menu/Header";
import BurgerMenu from "../components/figma/Menu/BurgerMenu";
import { FeaturedSection } from '@/components/figma/FeaturedSection';


export default function Home() {
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  const handleBurgerMenuToggle = (isOpen: boolean) => {
    setIsBurgerMenuOpen(isOpen);
    console.log('Burger menu state:', isOpen); // For debugging
  };
  return (
    <div className="w-full flex flex-col bg-[#05050a] relative overflow-x-hidden min-h-screen">

      <Header onBurgerMenuToggle={handleBurgerMenuToggle} />

      {/* Mobile Menu Overlay - shows when burger menu is open */}
      {isBurgerMenuOpen ? (
        <BurgerMenu />
      ) : (
        <>
          {/* Main content */}
          <main className="flex flex-col gap-16 py-8">

            {/* Featured Items Section */}
            <section className="py-16">
              <FeaturedSection />
            </section>

            {/* Reviews Section */}
            {/* <ReviewsSection /> */}
          </main>

          {/* Responzívny Footer */}
          {/* <ResponsiveFooter /> */}
        </>
      )}

    </div>
  );
}