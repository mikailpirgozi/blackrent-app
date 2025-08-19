import React from "react";
import { FAQ } from "../FAQ/FAQ";
import { QuickContact } from "../QuickContact/QuickContact";
import { MainFooter } from "../MainFooter/MainFooter";
import { CopyrightBar } from "../CopyrightBar/CopyrightBar";

interface PageFooterProps {
  variant?: "with-contact" | "simple" | "with-faq" | "full";
  contactVariant?: "mobile" | "tablet" | "desktop-1440" | "desktop-1728";
  footerVariant?: "mobile" | "desktop";
  faqVariant?: "mobile" | "tablet" | "desktop-1440" | "desktop-1728";
  className?: string;
  showQuickContact?: boolean;
  showFAQ?: boolean;
}

export const PageFooter: React.FC<PageFooterProps> = ({
  variant = "with-contact",
  contactVariant = "desktop-1728",
  footerVariant = "desktop",
  faqVariant = "desktop-1728",
  className = "",
  showQuickContact = true,
  showFAQ = false,
}) => {
  const shouldShowContact = (variant === "with-contact" || variant === "full") && showQuickContact;
  const shouldShowFAQ = (variant === "with-faq" || variant === "full") || showFAQ;

  if (footerVariant === "mobile") {
    return (
      <div className={`flex flex-col items-center w-full ${className}`}>
        {shouldShowFAQ && (
          <div className="w-full py-8 px-4">
            <div className="flex justify-center">
              <FAQ variant="mobile" />
            </div>
          </div>
        )}
        
        {shouldShowContact && (
          <div className="flex flex-col items-center pt-0 pb-0 px-0 relative">
            <div className="absolute bottom-[400px] left-1/2 transform -translate-x-1/2 z-20">
              <QuickContact variant="mobile" />
            </div>
          </div>
        )}
        
        <div className={shouldShowContact ? "mt-48" : ""}>
          <MainFooter variant="mobile" />
          <CopyrightBar variant="mobile" />
        </div>
      </div>
    );
  }

  // Desktop variants
  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {shouldShowFAQ && (
        <div className="w-full flex justify-center">
          <FAQ variant={faqVariant} />
        </div>
      )}
      
      {shouldShowContact && (
        <div className="flex flex-col items-center pt-0 pb-0 px-0 relative">
          {/* Quick Contact positioned above footer */}
          <div className="absolute bottom-[992px] left-1/2 transform -translate-x-1/2 z-20">
            <QuickContact variant={contactVariant} />
          </div>
        </div>
      )}
      
      <div className={`flex flex-col items-center ${shouldShowContact ? "mt-20" : ""}`}>
        <MainFooter variant="desktop" />
        <CopyrightBar variant="desktop" />
      </div>
    </div>
  );
};
