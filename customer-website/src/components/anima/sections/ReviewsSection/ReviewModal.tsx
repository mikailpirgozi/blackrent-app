"use client";

import React from "react";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: {
    name: string;
    text: string;
    backgroundImage: string;
    rating: number;
  };
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, review }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="relative bg-[#fafaff] rounded-3xl shadow-[0px_64px_128px_rgba(5,5,10,0.2),0px_32px_64px_rgba(5,5,10,0.5)]"
        style={{
          width: '874px',
          height: '560px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Image */}
        <div 
          className="absolute rounded-2xl overflow-hidden"
          style={{
            left: '32px',
            top: '32px',
            width: '424px',
            height: '496px',
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%), ${review.backgroundImage}`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{
            right: '32px',
            top: '32px'
          }}
        >
          <img 
            src="/assets/misc/icon-close-32px.svg" 
            alt="Close" 
            className="w-8 h-8"
          />
        </button>

        {/* Content */}
        <div 
          className="absolute flex flex-col gap-4"
          style={{
            left: '512px',
            top: '64px',
            width: '298px',
            height: '464px'
          }}
        >
          {/* Stars */}
          <div className="flex gap-0">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="w-6 h-6 flex items-center justify-center">
                <img 
                  src="/assets/misc/icon-star-24px.svg" 
                  alt="Star" 
                  className="w-4 h-4"
                />
              </div>
            ))}
          </div>

          {/* Name and Text */}
          <div className="flex flex-col gap-10">
            <h3 
              className="[font-family:'SF_Pro',Helvetica] font-[650] text-2xl leading-[28px] text-[#1e1e23]"
              style={{ width: '261px' }}
            >
              {review.name}
            </h3>
            <p 
              className="[font-family:'Poppins',Helvetica] font-normal text-sm leading-[20px] text-[#646469]"
              style={{ width: '282px' }}
            >
              {review.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
