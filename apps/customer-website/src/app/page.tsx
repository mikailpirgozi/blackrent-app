"use client";

import React from "react";
import { FeaturedSection } from '@/components/figma/FeaturedSection';
import RightPicsSmall from "@/components/figma/FeaturedSection/RightPicsSmall";
import LeftPicsSmall from "@/components/figma/FeaturedSection/LeftPicsSmall";


export default function Home() {

  return (
    <>
      {/* Main content */}
      <main className="flex flex-col py-8">

        {/* Featured Items Section */}
        <section className="pt-16">
          <FeaturedSection />
        </section>

        <div className="content-stretch flex flex-row items-start justify-between relative size-full sm:hidden">
          <div className="grid">
            <LeftPicsSmall />
          </div>
          <div className="grid">
            <RightPicsSmall />
          </div>
        </div>

        {/* Reviews Section */}
        {/* <ReviewsSection /> */}
      </main>

      {/* Responzívny Footer */}
      {/* <ResponsiveFooter /> */}
    </>

  );
}