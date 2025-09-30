import React from 'react';
import Image from 'next/image';

interface ButtonSecondaryProps {
  /** Path to SVG icon to display on the left side of the button (e.g., '/assets/icons/user.svg') */
  iconPath: string;
  /** Alt text for the icon */
  iconAlt?: string;
  /** Text to display in the button */
  text: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Optional additional CSS classes */
  className?: string;
}

export default function ButtonSecondary({ 
  iconPath, 
  iconAlt = '', 
  text, 
  onClick, 
  className = '' 
}: ButtonSecondaryProps) {
  return (
    <button
      className={`bg-[#283002] box-border content-stretch flex gap-[6px] items-center justify-center pl-[20px] pr-[24px] py-[12px] relative rounded-[99px] h-[40px] hover:bg-[#3a4203] transition-colors ${className}`}
      onClick={onClick}
      data-name="Secondary buttons 40 px +icon"
    >
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Icon 24 px">
        <div className="absolute inset-[12.5%_8.33%_8.33%_8.33%]" data-name="Vector (Stroke)">
          <Image 
            src={iconPath} 
            alt={iconAlt} 
            width={16} 
            height={16} 
            className="size-full object-contain"
          />
        </div>
      </div>
      <div className="flex flex-col font-poppins font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#d7ff14] text-[14px] text-nowrap">
        <p className="leading-[24px] whitespace-pre">{text}</p>
      </div>
    </button>
  );
}
