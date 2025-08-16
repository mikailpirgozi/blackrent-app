"use client";

import React, { useState } from "react";
import { navigationLinks, socialMediaLinks, contactInfo } from "../constants/footerData";

interface MainFooterProps {
  className?: string;
  variant?: "mobile" | "desktop";
}

export const MainFooter: React.FC<MainFooterProps> = ({ 
  className = "", 
  variant = "desktop" 
}) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Prosím zadajte platný e-mail");
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Newsletter subscription:', email);
      // Here you can add API call to subscribe user
      
      // Success feedback
      alert("Ďakujeme za prihlásenie k newsletteru!");
      setEmail("");
    } catch (error) {
      alert("Nastala chyba. Skúste to prosím znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "mobile") {
    return (
      <footer className={`w-full bg-[#05050a] overflow-hidden relative ${className}`}>
        <div className="w-full px-4 py-8 relative">
          <div className="flex flex-col gap-8 relative z-10">
            {/* Logo */}
            <img
              className="w-[214.4px] h-8 mx-auto"
              alt="BlackRent logo"
              src="/assets/brands/blackrent-logo.svg"
            />

            <div className="flex flex-col gap-8">
              {/* Newsletter Section */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 text-center">
                    Newsletter
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 text-center">
                    Prihláste sa na newsletter a získajte <span className="font-semibold">5€ voucher</span> na prenájom vozidla z našej autopožičovňe.
                  </p>
                </div>

                <form onSubmit={handleNewsletterSubmit}>
                  <div className="flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-[#1E1E23] rounded-[99px] overflow-hidden w-full">
                    <div className="flex items-center gap-2 flex-1">
                      <img
                        className="w-6 h-6"
                        alt="Message icon"
                        src="/assets/icons/message-icon-figma.svg"
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Váš e-mail"
                        disabled={isSubmitting}
                        className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm bg-transparent border-none outline-none placeholder:text-[#646469]"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting || !email.trim()}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D7FF14] rounded-[99px] hover:bg-[#c7ef04] disabled:opacity-50 transition-colors duration-200"
                    >
                      <span className="font-semibold text-[#141900] text-sm [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        {isSubmitting ? "..." : "Potvrdiť"}
                      </span>
                      <img
                        className="w-4 h-4"
                        alt="Arrow right"
                        src="/assets/icons/arrow-right-vector.svg"
                      />
                    </button>
                  </div>
                </form>
              </div>

              {/* Navigation sections */}
              <div className="flex flex-col gap-8">
                {/* Mapa stránok */}
                <div className="flex flex-col gap-6">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 text-center">
                    Mapa stránok
                  </h3>
                  <nav className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-6 text-center space-y-2">
                    {navigationLinks.map((link, index) => (
                      <div key={index} className={link.active ? "text-[#F0FF98]" : ""}>
                        {link.label}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Kontaktné informácie */}
                <div className="flex flex-col gap-6">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 text-center">
                    Sídlo spoločnosti
                  </h3>
                  <address className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-6 not-italic text-center space-y-1">
                    <div>{contactInfo.address.street}</div>
                    <div>{contactInfo.address.city}</div>
                    <div>{contactInfo.phone}</div>
                    <div>{contactInfo.email}</div>
                  </address>
                </div>

                {/* Sledujte nás */}
                <div className="flex flex-col gap-6">
                  <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 text-center">
                    Sledujte nás
                  </h3>
                  <div className="flex items-center justify-center gap-3">
                    {socialMediaLinks.map((social, index) => (
                      <a
                        key={index}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity duration-200"
                        aria-label={`Sledujte nás na ${social.alt}`}
                      >
                        <img
                          className="relative w-5 h-5"
                          alt={`${social.alt} icon`}
                          src={social.icon}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Desktop variant
  return (
    <footer className={`w-[1728px] h-[824px] bg-[#05050A] overflow-hidden relative ${className}`}>
      {/* Background Pattern */}
      <div className="absolute w-[476px] h-[1068px] top-0 right-[252px]">
        <img
          className="absolute w-[476px] h-[904px] top-0 left-0"
          alt="Background pattern"
          src="/assets/misc/pattern-3a.svg"
        />
      </div>

      {/* Footer Content - Frame 2608550 */}
      <div className="flex flex-col gap-20 absolute top-[336px] left-[200px] w-[1328px]">
        {/* Logo */}
        <img
          className="relative w-[214.4px] h-8"
          alt="BlackRent company logo"
          src="/assets/brands/blackrent-logo.svg"
        />

        {/* Frame 2608546 */}
        <div className="flex gap-[258px] w-[1328px]">
          {/* Newsletter Section - Frame 1028 */}
          <div className="flex flex-col gap-10 w-[422px]">
            <div className="flex flex-col gap-8 self-stretch">
              <h3 className="w-[109px] h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                Newsletter
              </h3>
              <p className="self-stretch h-8 [font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5">
                <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                  Prihláste sa na newsletter a získajte{" "}
                </span>
                <span className="font-semibold">5€ voucher </span>
                <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                  na prenájom vozidla z našej autopožičovňe.
                </span>
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit}>
              <div className="flex items-center justify-between gap-2 pl-4 pr-2 py-2 bg-[#1E1E23] rounded-[99px] overflow-hidden w-[422px]">
                <div className="flex items-center gap-2 flex-1">
                  <img
                    className="w-6 h-6"
                    alt="Message icon"
                    src="/assets/icons/message-icon-figma.svg"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Váš e-mail"
                    disabled={isSubmitting}
                    className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm bg-transparent border-none outline-none placeholder:text-[#646469]"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 bg-[#D7FF14] rounded-[99px] hover:bg-[#c7ef04] h-10 disabled:opacity-50 transition-colors duration-200"
                >
                  <span className="font-semibold text-[#141900] text-sm [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                    {isSubmitting ? "..." : "Potvrdiť"}
                  </span>
                  <img
                    className="w-4 h-4"
                    alt="Arrow right"
                    src="/assets/icons/arrow-right-vector.svg"
                  />
                </button>
              </div>
            </form>
          </div>

          {/* Frame 2608547 */}
          <div className="flex justify-between gap-8 flex-1">
            {/* Frame 504 */}
            <div className="flex flex-col gap-8 w-[195px]">
              <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">
                Mapa stránok
              </h3>
              <nav className="[font-family:'Poppins',Helvetica] font-normal text-[#FAFAFF] text-sm tracking-[0] leading-6 space-y-0">
                {navigationLinks.map((link, index) => (
                  <div key={index} className={link.active ? "text-[#F0FF98]" : "text-[#A0A0A5]"}>
                    {link.label}
                  </div>
                ))}
              </nav>
            </div>

            {/* Frame 2608548 */}
            <div className="flex flex-col gap-10 w-[195px]">
              {/* Frame 1030 */}
              <div className="flex flex-col gap-8">
                <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">
                  Sídlo spoločnosti
                </h3>
                <address className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-6 not-italic space-y-0">
                  <div>{contactInfo.address.street}</div>
                  <div>{contactInfo.address.city}</div>
                  <div>{contactInfo.phone}</div>
                  <div>{contactInfo.email}</div>
                </address>
              </div>
            </div>

            {/* Frame 2608549 */}
            <div className="flex flex-col gap-8 w-[195px]">
              {/* Sledujte nás - Frame 1032 */}
              <div className="flex flex-col gap-10">
                <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">
                  Sledujte nás
                </h3>
              </div>
              {/* Frame 296 */}
              <div className="inline-flex gap-4" role="list">
                {socialMediaLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-80 transition-opacity duration-200"
                    aria-label={`Sledujte nás na ${social.alt}`}
                    role="listitem"
                  >
                    <img
                      className="relative w-6 h-6"
                      alt={`${social.alt} icon`}
                      src={social.icon}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
