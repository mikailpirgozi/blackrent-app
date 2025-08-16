import React from "react";
import { PageFooter } from "../PageFooter";

// Ukážka ako nahradiť footer v ElementDetailVozidla
export const ElementDetailVozidlaExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f14]">
      {/* Obsah stránky detail vozidla... */}
      <div className="p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">Detail vozidla</h1>
        <p className="mb-8">Tu by bol obsah detail vozidla...</p>
        
        {/* Simulácia FAQ sekcie */}
        <div className="bg-[#0f0f14] rounded-t-[40px] pt-[200px] pb-0 px-2">
          <div className="text-center mb-[120px]">
            <h2 className="text-[40px] font-[650] text-[#f0ff98] mb-8">Časté otázky</h2>
            {/* FAQ obsah by bol tu... */}
            <div className="text-[#a0a0a5] mb-8">FAQ obsah...</div>
          </div>
        </div>
      </div>

      {/* NOVÝ FOOTER SYSTÉM - nahrádza celú footer sekciu */}
      <PageFooter 
        variant="with-contact"
        contactVariant="desktop-1728"
        footerVariant="desktop"
      />
    </div>
  );
};

// Ukážka pre rôzne breakpointy
export const ResponsiveFooterExample: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Mobile */}
      <div className="block md:hidden">
        <PageFooter 
          variant="with-contact"
          contactVariant="mobile"
          footerVariant="mobile"
        />
      </div>

      {/* Tablet */}
      <div className="hidden md:block lg:hidden">
        <PageFooter 
          variant="with-contact"
          contactVariant="tablet"
          footerVariant="desktop"
        />
      </div>

      {/* Desktop 1440 */}
      <div className="hidden lg:block xl:hidden">
        <PageFooter 
          variant="with-contact"
          contactVariant="desktop-1440"
          footerVariant="desktop"
        />
      </div>

      {/* Desktop 1728+ */}
      <div className="hidden xl:block">
        <PageFooter 
          variant="with-contact"
          contactVariant="desktop-1728"
          footerVariant="desktop"
        />
      </div>
    </div>
  );
};
