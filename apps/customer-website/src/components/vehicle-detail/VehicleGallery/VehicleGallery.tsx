'use client';

import React, { useState } from 'react';

interface VehicleGalleryProps {
  images: string[];
  className?: string;
}

export const VehicleGallery: React.FC<VehicleGalleryProps> = ({
  images,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className={`relative ${className}`}>
      {/* Mobile Gallery */}
      <div className="block md:hidden">
        <div className="flex w-[328px] h-64 items-end justify-end gap-2 p-4 absolute top-48 left-4 rounded-2xl overflow-hidden bg-cover bg-[50%_50%]"
             style={{ backgroundImage: `url(${images[currentImageIndex] || '/assets/frame-170.png'})` }}>
          <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
            <div className="relative w-6 h-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="white"/>
              </svg>
            </div>
            <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-xs tracking-[0] leading-6 whitespace-nowrap">
              {images.length}
            </div>
          </div>
        </div>

        {/* Mobile Image Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 absolute top-[520px] left-1/2 transform -translate-x-1/2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-[#F0FF98]' : 'bg-[#9B9BA0]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet Gallery */}
      <div className="hidden md:block lg:hidden">
        <div className="flex w-[680px] h-[400px] items-end justify-end gap-2 p-4 absolute top-[200px] left-8 rounded-2xl overflow-hidden bg-cover bg-[50%_50%]"
             style={{ backgroundImage: `url(${images[currentImageIndex] || '/assets/frame-170.png'})` }}>
          <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
            <div className="relative w-6 h-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="white"/>
              </svg>
            </div>
            <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
              {images.length}
            </div>
          </div>
        </div>

        {/* Tablet Image Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 absolute top-[620px] left-1/2 transform -translate-x-1/2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full ${
                  index === currentImageIndex ? 'bg-[#F0FF98]' : 'bg-[#9B9BA0]'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop Gallery */}
      <div className="hidden lg:block">
        <div className="flex w-[1376px] h-[500px] items-end justify-end gap-2 p-6 absolute top-[200px] left-44 rounded-2xl overflow-hidden bg-cover bg-[50%_50%]"
             style={{ backgroundImage: `url(${images[currentImageIndex] || '/assets/frame-170.png'})` }}>
          <div className="inline-flex items-center gap-1 px-4 py-2 relative flex-[0_0_auto] bg-[#00000080] rounded-lg">
            <div className="relative w-6 h-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="white"/>
              </svg>
            </div>
            <div className="relative w-fit font-['Poppins',Helvetica] font-medium text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
              {images.length}
            </div>
          </div>
        </div>

        {/* Desktop Image Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center gap-3 absolute top-[720px] left-1/2 transform -translate-x-1/2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-4 h-4 rounded-full ${
                  index === currentImageIndex ? 'bg-[#F0FF98]' : 'bg-[#9B9BA0]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Desktop Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 absolute top-[760px] left-44 overflow-x-auto max-w-[1376px]">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  index === currentImageIndex ? 'border-[#F0FF98]' : 'border-transparent'
                }`}
              >
                <img
                  src={image}
                  alt={`Vehicle image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
