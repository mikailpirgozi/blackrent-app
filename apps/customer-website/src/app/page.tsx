"use client";

import React, { useState } from "react";
import Header from "../components/figma/Menu/Header";
import BurgerMenu from "../components/figma/Menu/BurgerMenu";
import { FeaturedSection } from '@/components/figma/FeaturedSection';
import RightPicsSmall from "@/components/figma/FeaturedSection/RightPicsSmall";
import LeftPicsSmall from "@/components/figma/FeaturedSection/LeftPicsSmall";


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
          <main className="flex flex-col py-8">

            {/* Featured Items Section */}
            <section className="pt-16">
              <FeaturedSection />
            </section>

            <div className="content-stretch flex flex-row items-start justify-between relative size-full sm:hidden">

              {/* <div className="grid grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0 md:hidden"> */}
                <div className="grid">
                  <LeftPicsSmall />
                </div>
                <div className="grid">
                  <RightPicsSmall />
                </div>
              {/* </div> */}

            </div>

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