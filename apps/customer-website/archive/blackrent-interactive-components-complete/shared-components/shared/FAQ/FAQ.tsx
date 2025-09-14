"use client";

import React, { useState } from "react";
import { faqData, FAQItem } from "../constants/faqData";

interface FAQProps {
  className?: string;
  variant?: "mobile" | "tablet" | "desktop-1440" | "desktop-1728";
}

export const FAQ: React.FC<FAQProps> = ({ 
  className = "", 
  variant = "desktop-1728" 
}) => {
  const [expandedFAQ, setExpandedFAQ] = useState<Record<string, boolean>>({});

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderFAQItem = (faq: FAQItem, index: number, columnPrefix: string) => {
    const id = `${columnPrefix}-${index}`;
    const isExpanded = expandedFAQ[id];

    if (variant === "mobile") {
      return (
        <div key={id} className="flex flex-col items-start gap-2 p-4 bg-[#1E1E23] rounded-lg">
          <button
            type="button"
            onClick={() => toggleFAQ(id)}
            className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-5 text-left pr-4">
              {faq.question}
            </div>
            <div className="w-5 h-5 flex items-center justify-center">
              <svg 
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {isExpanded && (
            <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-5">
                {faq.answer}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (variant === "tablet") {
      return (
        <div key={id} className="flex flex-col items-start gap-3 p-4 bg-[#1E1E23] rounded-lg">
          <button
            type="button"
            onClick={() => toggleFAQ(id)}
            className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 text-left pr-4">
              {faq.question}
            </div>
            <div className="w-6 h-6 flex items-center justify-center">
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          
          {isExpanded && (
            <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
              <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-base leading-6">
                {faq.answer}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Desktop variants (1440 and 1728)
    return (
      <div key={id} className="flex flex-col justify-center items-stretch gap-2 pt-4 pr-4 pb-4 pl-6 bg-[#1E1E23] rounded-lg">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleFAQ(id)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm leading-[1.7142857142857142em] text-left pr-4">
              {faq.question}
            </div>
          </div>
          <div className="w-6 h-6 flex items-center justify-center">
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="#D7FF14"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#37373C]">
            <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-[1.4285714285714286em]">
              {faq.answer}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (variant === "mobile") {
    return (
      <div className={`flex flex-col w-[328px] items-start gap-6 ${className}`}>
        <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
          Časté otázky
        </div>

        <div className="flex flex-col gap-3 w-full">
          {[...faqData.leftColumn, ...faqData.rightColumn].map((faq, index) => 
            renderFAQItem(faq, index, "mobile")
          )}
        </div>
      </div>
    );
  }

  if (variant === "tablet") {
    return (
      <div className={`flex flex-col w-[680px] items-start gap-8 ${className}`}>
        <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#F0FF98] text-2xl tracking-[0] leading-7 whitespace-nowrap">
          Časté otázky
        </div>

        <div className="flex flex-col gap-4 w-full">
          {[...faqData.leftColumn, ...faqData.rightColumn].map((faq, index) => 
            renderFAQItem(faq, index, "tablet")
          )}
        </div>
      </div>
    );
  }

  if (variant === "desktop-1440") {
    return (
      <div className={`flex flex-col w-[1120px] items-center gap-[120px] px-8 py-[200px] bg-[#0F0F14] rounded-t-[20px] ${className}`}>
        <div className="[font-family:'SF_Pro',Helvetica] font-[650] text-[#F0FF98] text-[40px] tracking-[0] leading-6 whitespace-nowrap">
          Časté otázky
        </div>

        <div className="flex items-start gap-8 w-full">
          {/* Left Column */}
          <div className="flex flex-col gap-4 flex-1">
            {faqData.leftColumn.map((faq, index) => 
              renderFAQItem(faq, index, "left-1440")
            )}
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-4 flex-1">
            {faqData.rightColumn.map((faq, index) => 
              renderFAQItem(faq, index, "right-1440")
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop 1728px variant
  return (
    <div className={`flex flex-col w-[1728px] items-center gap-2 pt-[200px] pb-0 px-2 bg-[#0F0F14] rounded-t-[40px] ${className}`}>
      {/* FAQ Section - Frame 359 */}
      <div className="flex flex-col items-center gap-[120px] relative">
        {/* FAQ Title */}
        <div className="relative w-[300px] h-6 [font-family:'SF_Pro',Helvetica] font-[650] text-[40px] leading-[0.6em] text-center text-[#F0FF98]">
          Časté otázky
        </div>
        
        {/* FAQ Content - Frame 358 */}
        <div className="flex gap-8 relative">
          {/* Left Column */}
          <div className="flex flex-col gap-4 w-[567px]">
            {faqData.leftColumn.map((faq, index) => 
              renderFAQItem(faq, index, "left-1728")
            )}
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col gap-4 w-[567px]">
            {faqData.rightColumn.map((faq, index) => 
              renderFAQItem(faq, index, "right-1728")
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
