import React from "react";
import { PageFooter } from "../PageFooter";

export const FooterDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Footer Components Demo</h1>
        
        <div className="space-y-16">
          {/* Desktop with contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Desktop s Quick Contact</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <PageFooter 
                variant="with-contact"
                contactVariant="desktop-1728"
                footerVariant="desktop"
              />
            </div>
          </section>

          {/* Desktop without contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Desktop bez Quick Contact</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg">
              <PageFooter 
                variant="simple"
                footerVariant="desktop"
              />
            </div>
          </section>

          {/* Mobile with contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Mobile s Quick Contact</h2>
            <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-md mx-auto">
              <PageFooter 
                variant="with-contact"
                contactVariant="mobile"
                footerVariant="mobile"
              />
            </div>
          </section>

          {/* Different contact variants */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Rôzne varianty Quick Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <h3 className="text-lg font-medium p-4 bg-gray-50">Tablet</h3>
                <PageFooter 
                  variant="with-contact"
                  contactVariant="tablet"
                  footerVariant="desktop"
                />
              </div>
              <div className="bg-white rounded-lg overflow-hidden shadow-lg">
                <h3 className="text-lg font-medium p-4 bg-gray-50">Desktop 1440</h3>
                <PageFooter 
                  variant="with-contact"
                  contactVariant="desktop-1440"
                  footerVariant="desktop"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
