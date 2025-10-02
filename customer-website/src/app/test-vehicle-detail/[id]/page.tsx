'use client';

import React from 'react';
import { ResponsiveHeader } from '../../../components/shared/ResponsiveHeader/ResponsiveHeader';
import { ResponsiveVehicleDetail } from '../../../components/vehicle-detail/ResponsiveVehicleDetail';
import { VehicleHeroSection } from '../../../components/vehicle-detail/VehicleHeroSection';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';

interface TestVehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default function TestVehicleDetailPage({ params }: TestVehicleDetailPageProps) {
  // Používame responzívny layout hook ako na test-responsive stránke
  const { containerWidth } = useResponsiveLayout();

  // Simulujeme dáta vozidla na základe ID
  const vehicleData = {
    name: `Ford Mustang ${params.id}`,
    images: [
      "/figma-assets/n-h-ad-vozidla-1.png",
      "/figma-assets/n-h-ad-vozidla-10.png", 
      "/figma-assets/n-h-ad-vozidla-12.png",
      "/figma-assets/n-h-ad-vozidla-14.png"
    ],
    description: `Detailný opis vozidla s ID ${params.id} - luxusné vozidlo s výnimočnými vlastnosťami.`
  };

  // Dáta pre hero sekciu
  const heroData = {
    name: "Ford Mustang",
    power: "123 kW",
    fuel: "Benzín", 
    transmission: "Automat",
    drivetrain: "Predný"
  };

  return (
    <div className="min-h-screen bg-[#05050a]">
      {/* ResponsiveHeader - náš perfektný interaktívny menu bar */}
      <ResponsiveHeader />
      
      {/* Hlavný obsah stránky */}
      <main className="w-full">
        {/* Hero sekcia podľa Figma Frame 1344 */}
        <div className="flex justify-center py-8">
          <VehicleHeroSection 
            vehicleData={heroData}
          />
        </div>

        {/* ResponsiveVehicleDetail sekcia - presne ako na test-responsive stránke */}
        <div 
          className="flex justify-center transition-all duration-300"
          style={{
            width: containerWidth,
            margin: '0 auto',
            overflow: 'visible'
          }}
        >
          <ResponsiveVehicleDetail 
            vehicleData={vehicleData}
            forcedWidth={null}
          />
        </div>
      </main>
    </div>
  );
}
