'use client'

import React from 'react';
import Image from 'next/image';
import { Icon } from './Icon';

export interface Vehicle {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
  features: string[];
  rating: number;
  available: boolean;
}

export interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: (vehicle: Vehicle) => void;
  onReserve?: (vehicleId: string) => void;
  compact?: boolean;
  // Legacy props for backward compatibility
  id?: string;
  name?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  discount?: string;
  imageUrl?: string;
  hasDphTag?: boolean;
  hasDiscount?: boolean;
  variant?: 'default' | 'hover' | 'dph' | 'discount-dph';
  onClick?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onSelect,
  onReserve,
  compact = false,
  // Legacy props
  id,
  name,
  description,
  price,
  originalPrice,
  discount,
  imageUrl,
  hasDphTag = false,
  hasDiscount = false,
  variant = 'default',
  onClick
}) => {
  // Use new props if vehicle is provided, otherwise use legacy props
  const vehicleData = vehicle || {
    id: id || '',
    name: name || '',
    image: imageUrl || '',
    price: price ? parseFloat(price.replace(/[^0-9.]/g, '')) : 0,
    category: '',
    features: [],
    rating: 0,
    available: true
  };

  const isHoverVariant = variant === 'hover';
  const hasTags = hasDphTag || hasDiscount || variant === 'dph' || variant === 'discount-dph';
  
  const handleCardClick = () => {
    if (onSelect && vehicle) {
      onSelect(vehicle);
    } else if (onClick) {
      onClick();
    }
  };

  const handleReserveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReserve) {
      onReserve(vehicleData.id);
    }
  };
  
  return (
    <article 
      className={`
        ${isHoverVariant ? 'bg-blackrent-card-hover' : 'bg-blackrent-card'} 
        hover:bg-blackrent-card-hover transition-all duration-300 rounded-[24px] p-4 
        ${compact ? 'w-300 h-350 compact' : 'w-422 h-424'} flex flex-col gap-[14px] cursor-pointer group
      `}
      onClick={handleCardClick}
    >
      {/* Frame 500 - Main Container */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Vehicle Image Container */}
        <div className={`
          relative rounded-lg overflow-hidden flex-1
          ${hasTags ? 'p-2' : 'p-4'}
        `}>
          <Image 
            src={vehicleData.image} 
            alt={vehicleData.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 422px"
            className="object-cover rounded-lg"
          />
          
          {/* Tags - positioned in top-left with gap */}
          {hasTags && (
            <div className="absolute top-2 left-2 flex flex-col gap-2">
              {(hasDiscount || variant === 'discount-dph') && (
                <div className="bg-blackrent-green rounded-full px-3 py-1 h-6 flex items-center">
                  <span className="text-blackrent-green-text font-poppins font-medium text-xs leading-6">
                    {discount || '-25%'}
                  </span>
                </div>
              )}
              {(hasDphTag || variant === 'dph' || variant === 'discount-dph') && (
                <div className="bg-blackrent-text-primary rounded-full px-3 py-1 h-6 flex items-center">
                  <span className="text-blackrent-card-hover font-poppins font-medium text-xs leading-6">
                    Možný odpočet DPH
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Frame 499 - Content Container */}
        <div className="flex flex-col justify-between flex-1 gap-1 pl-4">
          {/* Frame 207 - Title and Description */}
          <div className="flex flex-col gap-4">
            <h3 className="text-blackrent-accent font-sf-pro font-semibold text-2xl leading-[28px] h-4 flex items-end">
              {vehicleData.name}
            </h3>
            <p className="text-blackrent-text-secondary font-poppins font-normal text-xs leading-6">
              {vehicleData.category}
            </p>
            
            {/* Price */}
            <div className="text-blackrent-text-primary font-poppins font-semibold text-xl leading-[24px]">
              {vehicleData.price}€/deň
            </div>
            
            {/* Rating */}
            {vehicle && (
              <div className="text-blackrent-text-secondary font-poppins font-normal text-sm">
                {vehicleData.rating}
              </div>
            )}
            
            {/* Features */}
            {vehicle && vehicleData.features.length > 0 && (
              <div className="flex flex-col gap-1">
                {vehicleData.features.map((feature, index) => (
                  <span key={index} className="text-blackrent-text-secondary font-poppins font-normal text-xs">
                    {feature}
                  </span>
                ))}
              </div>
            )}
            
            {/* Availability */}
            {vehicle && (
              <div className={`text-sm font-medium ${vehicleData.available ? 'text-green-600' : 'text-red-600'}`}>
                {vehicleData.available ? 'Dostupné' : 'Nedostupné'}
              </div>
            )}
          </div>
          
          {/* Reserve Button */}
          {vehicle && (
            <button 
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors
                ${vehicleData.available 
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              disabled={!vehicleData.available}
              onClick={handleReserveClick}
            >
              Rezervovať
            </button>
          )}
          
          {/* Legacy Button - 64x64px */}
          {!vehicle && (
            <div className="flex justify-between items-end gap-28">
              <div className="flex-1 pb-4">
                <div className="text-blackrent-text-primary font-poppins font-semibold text-xl leading-[24px]">
                  {hasDiscount && originalPrice ? (
                    <span>
                      <span className="line-through text-blackrent-text-secondary">{originalPrice}</span>
                      <span> {price}</span>
                    </span>
                  ) : (
                    price
                  )}
                </div>
              </div>
              
              <button className={`
                ${isHoverVariant ? 'bg-blackrent-green-dark' : 'bg-blackrent-card-hover'} 
                group-hover:bg-blackrent-green-dark transition-colors rounded-full 
                w-16 h-16 flex items-center justify-center
              `}>
                <div className="w-8 h-8 relative">
                  <Icon 
                    name="arrow-top-right" 
                    className={`
                      w-4 h-4 absolute top-2 left-2
                      ${isHoverVariant ? 'text-blackrent-green' : 'text-blackrent-text-secondary'} 
                      group-hover:text-blackrent-green
                    `} 
                  />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default VehicleCard;