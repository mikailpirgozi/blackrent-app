'use client'

import React from 'react';
import Image from 'next/image';
import { Icon } from './Icon';

export interface VehicleCardProps {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  imageUrl: string;
  hasDphTag?: boolean;
  hasDiscount?: boolean;
  variant?: 'default' | 'hover' | 'dph' | 'discount-dph';
  onClick?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
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
  const isHoverVariant = variant === 'hover';
  const hasTags = hasDphTag || hasDiscount || variant === 'dph' || variant === 'discount-dph';
  
  return (
    <div 
      className={`
        ${isHoverVariant ? 'bg-blackrent-card-hover' : 'bg-blackrent-card'} 
        hover:bg-blackrent-card-hover transition-all duration-300 rounded-[24px] p-4 
        w-422 h-424 flex flex-col gap-[14px] cursor-pointer group
      `}
      onClick={onClick}
    >
      {/* Frame 500 - Main Container */}
      <div className="flex flex-col gap-6 flex-1">
        {/* Vehicle Image Container */}
        <div className={`
          relative rounded-lg overflow-hidden flex-1
          ${hasTags ? 'p-2' : 'p-4'}
        `}>
          <Image 
            src={imageUrl} 
            alt={name}
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
              {name}
            </h3>
            <p className="text-blackrent-text-secondary font-poppins font-normal text-xs leading-6">
              {description}
            </p>
          </div>
          
          {/* Frame 498 - Price and Button Container */}
          <div className="flex justify-between items-end gap-28">
            {/* Frame 497 - Price Container */}
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
            
            {/* Button - 64x64px */}
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
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;