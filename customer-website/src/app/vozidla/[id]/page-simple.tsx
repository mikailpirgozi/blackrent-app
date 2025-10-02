'use client';

import React from 'react';

interface VehicleDetailPageProps {
  params: {
    id: string;
  };
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  return (
    <div className="w-screen bg-[#05050a] min-h-screen flex flex-col">
      <div className="p-8 text-white">
        <h1>Vehicle Detail: {params.id}</h1>
        <p>Test page - layout reorganized according to Figma design</p>
      </div>
    </div>
  );
}
