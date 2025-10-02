import React from "react";
import { footerLinks } from "../constants/footerData";

interface CopyrightBarProps {
  className?: string;
  variant?: "mobile" | "desktop";
}

export const CopyrightBar: React.FC<CopyrightBarProps> = ({ 
  className = "", 
  variant = "desktop" 
}) => {
  if (variant === "mobile") {
    return (
      <div className={`flex w-full items-center justify-center py-6 px-4 bg-black ${className}`}>
        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#37373C] text-xs tracking-[0] leading-6 text-center">
          © 2024 blackrent.sk | {footerLinks.join(" | ")}
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div className={`flex w-[1728px] h-24 items-center gap-2 px-[200px] py-0 bg-black ${className}`}>
      <p className="relative w-[855px] h-2 [font-family:'Poppins',Helvetica] font-normal text-[#37373C] text-xs tracking-[0] leading-6 whitespace-nowrap">
        © 2024 blackrent.sk | {footerLinks.join(" | ")}
      </p>
    </div>
  );
};
