"use client";

import React, { useState } from "react";
import { useWindowWidth } from "../../../hooks/useWindowWidth";

export const ResponsiveFooter = () => {
  const screenWidth = useWindowWidth();
  
  // FAQ state
  const [expandedFAQ, setExpandedFAQ] = useState<Record<number, boolean>>({});
  const [email, setEmail] = useState("");

  // Navigation links
  const navigationLinks = [
    { label: "Ponuka vozidiel", href: "/vozidla", active: false },
    { label: "Služby", href: "/services", active: false },
    { label: "Store", href: "/store", active: false },
    { label: "Kontakt", href: "/contact", active: false },
    { label: "O nás", href: "/about", active: true },
    { label: "Prihlásenie a Registrácia", href: "/auth", active: false },
  ];

  // Social media links
  const socialMediaLinks = [
    {
      icon: "/assets/icons/facebook-icon.svg",
      href: "https://facebook.com/blackrent",
      alt: "Facebook",
    },
    {
      icon: "/assets/icons/instagram-icon.svg",
      href: "https://instagram.com/blackrent",
      alt: "Instagram",
    },
    {
      icon: "/assets/icons/tiktok-icon.svg",
      href: "https://tiktok.com/@blackrent",
      alt: "TikTok",
    },
  ];

  const footerLinks = [
    "Obchodné podmienky",
    "Pravidlá pre súbory cookies",
    "Reklamačný poriadok",
    "Ochrana osobných údajov",
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <>
        {/* Desktop 1728px */}
        {screenWidth >= 1728 && (
          <div className="flex flex-col w-full items-center gap-2 pt-[200px] pb-0 px-2 bg-[#0F0F14] rounded-t-[40px]">
            
            {/* FAQ Section - Desktop 1728px */}
            <div className="flex flex-col items-center gap-[120px] relative">
              <div className="relative w-[300px] h-6 [font-family:'SF_Pro',Helvetica] font-[650] text-[40px] leading-[0.6em] text-center text-[#F0FF98]">
                Časté otázky
              </div>
              
              <div className="flex gap-8 relative">
                {/* Left Column */}
                <div className="flex flex-col gap-4 w-[567px]">
                  {[
                    {
                      question: "Čo je zahrnuté v cene prenájmu?",
                      answer: "V cene prenájmu je zahrnuté základné poistenie vozidla, neobmedzené kilometre v rámci Slovenska a základná technická podpora. Nie sú zahrnuté palivá, diaľničné známky a dodatočné poistenie."
                    },
                    {
                      question: "V akom stave je vozidlo pri odovzdaní nájomcovi?",
                      answer: "Všetky vozidlá sú pred odovzdaním dôkladne vyčistené a technicky skontrolované. Vozidlo dostanete s plnou nádržou paliva a v bezchybnom technickom stave."
                    },
                    {
                      question: "Do ktorých krajín môžem s vozidlom vycestovať?",
                      answer: "Základný balík umožňuje cestovanie po Slovensku, Česku a Rakúsku. Za príplatok môžete rozšíriť na ďalšie krajiny EÚ."
                    },
                    {
                      question: "Môžem cestovať aj do krajín mimo Európskej Únie?",
                      answer: "Cestovanie mimo EÚ je možné po individuálnom posúdení a schválení. Kontaktujte nás pre viac informácií o podmienkach."
                    },
                    {
                      question: "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
                      answer: "Áno, ponúkame službu prevzatia a odovzdania vozidla mimo otváracích hodín za príplatok 20€. Službu je potrebné dohodnúť vopred."
                    },
                    {
                      question: "Ako môžem platiť za prenájom vozidla?",
                      answer: "Akceptujeme platby kreditnou kartou, bankovým prevodom alebo hotovosťou. Depozit je možné zložiť len kreditnou kartou."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="flex flex-col justify-center items-stretch gap-2 pt-4 pr-4 pb-4 pl-6 bg-[#1E1E23] rounded-lg">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleFAQ(index)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm leading-[1.7142857142857142em] whitespace-nowrap overflow-hidden text-ellipsis">
                            {faq.question}
                          </div>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img 
                            src="/assets/misc/Icon 24 px filled.svg" 
                            alt="Toggle FAQ"
                            className={`w-6 h-6 transition-transform duration-200 ${
                              expandedFAQ[index] ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                      {expandedFAQ[index] && (
                        <div className="mt-4 pt-4 border-t border-[#37373C]">
                          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-[1.4285714285714286em]">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Right Column */}
                <div className="flex flex-col gap-4 w-[567px]">
                  {[
                    {
                      question: "Majú vozidlá diaľničnú známku?",
                      answer: "Áno, všetky naše vozidlá majú platnú diaľničnú známku pre Slovensko. Pre ostatné krajiny si diaľničné známky zabezpečte sami."
                    },
                    {
                      question: "Je možná preprava zvierat?",
                      answer: "Preprava zvierat je povolená za dodržania hygienických podmienok. Za dodatočné čistenie vozidla účtujeme poplatok 50€."
                    },
                    {
                      question: "Ako mám postupovať keď viem, že budem meškať?",
                      answer: "Okamžite nás kontaktujte na +421 910 666 949. Meškanie do 1 hodiny je bez poplatku, každá ďalšia hodina je spoplatnená 10€."
                    },
                    {
                      question: "Čo znamená jeden deň prenájmu?",
                      answer: "Jeden deň prenájmu predstavuje 24-hodinové obdobie od času prevzatia vozidla. Prekročenie času je spoplatnené ako ďalší deň."
                    },
                    {
                      question: "Čo ak dostanem pokutu?",
                      answer: "Všetky pokuty a poplatky počas prenájmu znáša nájomca. Administratívny poplatok za vybavenie pokuty je 25€."
                    },
                    {
                      question: "Aké sú podmienky stornácie rezervácie?",
                      answer: "Rezerváciu môžete zrušiť do 24 hodín pred začiatkom prenájmu bez poplatku. Pri neskoršom zrušení účtujeme 50% z ceny prenájmu."
                    }
                  ].map((faq, index) => (
                    <div key={index + 6} className="flex flex-col justify-center items-stretch gap-2 pt-4 pr-4 pb-4 pl-6 bg-[#1E1E23] rounded-lg">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleFAQ(index + 6)}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm leading-[1.7142857142857142em] whitespace-nowrap overflow-hidden text-ellipsis">
                            {faq.question}
                          </div>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img 
                            src="/assets/misc/Icon 24 px filled.svg" 
                            alt="Toggle FAQ"
                            className={`w-6 h-6 transition-transform duration-200 ${
                              expandedFAQ[index + 6] ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                      {expandedFAQ[index + 6] && (
                        <div className="mt-4 pt-4 border-t border-[#37373C]">
                          <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-[1.4285714285714286em]">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Contact 1728px */}
            <div className="flex flex-col w-[1328px] items-center pt-24 pb-[72px] px-0 relative mt-20 bg-[#F0F0F5] rounded-3xl">
              <div className="absolute w-[104px] h-[104px] -top-12 left-[612px] rounded-[99px] p-2">
                <img
                  className="w-full h-full rounded-[99px] object-cover"
                  alt="Operátor BlackRent"
                  src="/assets/misc/operator-avatar-728c4b.png"
                />
              </div>
              <div className="absolute w-3 h-3 top-[30px] left-[698px] bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />

              <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
                <header className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                  <h1 className="relative w-[874px] h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-[32px] text-center tracking-[0] leading-6 whitespace-nowrap">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h1>
                  <p className="relative w-[874px] h-4 [font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </header>

                <div className="flex h-10 items-center justify-center gap-4 relative self-stretch w-full">
                  <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
                    <img className="relative w-6 h-6" alt="Phone icon" src="/assets/icons/phone-icon.svg" />
                    <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                      <a
                        className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200"
                        href="tel:+421910666949"
                        aria-label="Zavolajte nám na číslo +421 910 666 949"
                      >
                        +421 910 666 949
                      </a>
                    </div>
                  </div>
                  <div className="relative self-stretch w-px bg-[#BEBEC3]" />
                  <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                    <img className="relative w-6 h-6" alt="Email icon" src="/assets/icons/email-icon.svg" />
                    <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
                      <a
                        className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap hover:text-[#283002] transition-colors duration-200"
                        href="mailto:info@blackrent.sk"
                        aria-label="Napíšte nám e-mail na info@blackrent.sk"
                      >
                        info@blackrent.sk
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute w-[304px] h-[304px] top-0 left-0 rounded-3xl overflow-hidden">
                <img
                  className="absolute w-[294px] h-[660px] top-0 left-0"
                  alt="Decorative background pattern"
                  src="/assets/misc/pattern-2a-correct.svg"
                />
              </div>
            </div>

            {/* Footer 1728px */}
            <div className="flex flex-col gap-20 relative mt-20 w-[1328px]">
              <div className="relative w-[214.4px] h-8 bg-[#1E1E23]" style={{maskImage: 'url(/assets/brands/blackrent-logo.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/assets/brands/blackrent-logo.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}} aria-label="BlackRent company logo" />
              <div className="flex gap-[258px] w-[1328px]">
                <div className="flex flex-col gap-10 w-[422px]">
                  <div className="flex flex-col gap-8 self-stretch">
                    <h3 className="w-[109px] h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6 whitespace-nowrap">Newsletter</h3>
                    <p className="self-stretch h-8 [font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5">
                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">Prihláste sa na newsletter a získajte </span>
                      <span className="font-semibold">5€ voucher </span>
                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">na prenájom vozidla z našej autopožičovňe.</span>
                    </p>
                  </div>
                  <form onSubmit={handleNewsletterSubmit} className="flex w-[422px] items-center justify-between pl-4 pr-2 py-2 bg-[#1E1E23] rounded-[99px] overflow-hidden">
                    <div className="flex items-center gap-2 flex-1">
                      <img className="relative w-6 h-6" alt="Email icon" src="/assets/icons/message-icon-figma.svg" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Váš e-mail"
                        required
                        className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-6 bg-transparent border-none outline-none placeholder:text-[#646469]"
                        aria-label="Zadajte váš e-mail pre newsletter"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 bg-[#F0FF98] rounded-[99px] hover:bg-[#D7FF14] transition-colors duration-200"
                      aria-label="Potvrdiť prihlásenie na newsletter"
                    >
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#283002] text-sm tracking-[0] leading-6 whitespace-nowrap">Potvrdiť</span>
                      <img className="relative w-4 h-4" alt="Submit arrow icon" src="/assets/misc/arrow-small-down.svg" />
                    </button>
                  </form>
                </div>
                <div className="flex justify-between gap-8 flex-1">
                  <div className="flex flex-col gap-8 w-[195px]">
                    <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Mapa stránok</h3>
                    <nav aria-label="Site navigation">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6">
                        {navigationLinks.map((link, index) => (
                          <div key={index} className="mb-1">
                            <a href={link.href} className={`hover:underline transition-colors duration-200 ${link.active ? "text-[#f0ff98] font-medium" : "text-[#FAFAFF] hover:text-[#F0F0F5]"}`}>
                              {link.label}
                            </a>
                          </div>
                        ))}
                      </div>
                    </nav>
                  </div>
                  <div className="flex flex-col gap-10 w-[195px]">
                    <div className="flex flex-col gap-8">
                      <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Sídlo spoločnosti</h3>
                      <address className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-6 not-italic">
                        <p className="m-0">Rozmarínová 211/3</p>
                        <p className="m-0">91101 Trenčín</p>
                        <p className="m-0"><a href="tel:+421910666949" className="text-[#A0A0A5] hover:text-[#F0F0F5] transition-colors duration-200">+421 910 666 949</a></p>
                        <p className="m-0"><a href="mailto:info@blackrent.sk" className="text-[#A0A0A5] hover:text-[#F0F0F5] transition-colors duration-200">info@blackrent.sk</a></p>
                      </address>
                    </div>
                    <div className="flex flex-col gap-8">
                      <div className="flex flex-col gap-10">
                        <h3 className="h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Sledujte nás</h3>
                      </div>
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
                            <img className="relative w-6 h-6" alt={`${social.alt} icon`} src={social.icon} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex w-full h-24 items-center gap-2 px-[200px] py-0 relative bg-black">
              <p className="relative w-[855px] h-2 [font-family:'Poppins',Helvetica] font-normal text-[#646469] text-xs tracking-[0] leading-6 whitespace-nowrap">
                © 2024 blackrent.sk | {footerLinks.join(" | ")}
              </p>
            </div>
          </div>
        )}

        {/* Desktop 1440px */}
        {screenWidth >= 1440 && screenWidth < 1728 && (
          <div className="flex flex-col w-full items-center bg-[#0F0F14] rounded-t-[20px]">
            {/* FAQ Section */}
            <div className="flex flex-col w-[1120px] items-center gap-[120px] px-8 py-[200px]">
              <div className="[font-family:'SF_Pro',Helvetica] font-[650] text-[#F0FF98] text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                Časté otázky
              </div>

              <div className="flex items-start gap-8 w-full">
                {/* Left Column */}
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    {
                      question: "Čo je zahrnuté v cene prenájmu?",
                      answer: "V cene prenájmu je zahrnuté základné poistenie vozidla, neobmedzené kilometre v rámci Slovenska a základná technická podpora. Nie sú zahrnuté palivá, diaľničné známky a dodatočné poistenie."
                    },
                    {
                      question: "V akom stave je vozidlo pri odovzdaní nájomcovi?",
                      answer: "Všetky vozidlá sú pred odovzdaním dôkladne vyčistené a technicky skontrolované. Vozidlo dostanete s plnou nádržou paliva a v bezchybnom technickom stave."
                    },
                    {
                      question: "Do ktorých krajín môžem s vozidlom vycestovať?",
                      answer: "Základný balík umožňuje cestovanie po Slovensku, Česku a Rakúsku. Za príplatok môžete rozšíriť na ďalšie krajiny EÚ."
                    },
                    {
                      question: "Môžem cestovať aj do krajín mimo Európskej Únie?",
                      answer: "Cestovanie mimo EÚ je možné po individuálnom posúdení a schválení. Kontaktujte nás pre viac informácií o podmienkach."
                    },
                    {
                      question: "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
                      answer: "Áno, ponúkame službu prevzatia a odovzdania vozidla mimo otváracích hodín za príplatok 20€. Službu je potrebné dohodnúť vopred."
                    },
                    {
                      question: "Ako môžem platiť za prenájom vozidla?",
                      answer: "Akceptujeme platby kreditnou kartou, bankovým prevodom alebo hotovosťou. Depozit je možné zložiť len kreditnou kartou."
                    }
                  ].map((faq, index) => (
                    <div key={index + 200} className="flex flex-col items-start gap-2 p-6 bg-[#1E1E23] rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleFAQ(index + 200)}
                        className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {faq.question}
                          </div>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img 
                            src="/assets/misc/Icon 24 px filled.svg" 
                            alt="Toggle FAQ"
                            className={`w-6 h-6 transition-transform duration-200 ${expandedFAQ[index + 200] ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>
                      
                      {expandedFAQ[index + 200] && (
                        <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
                          <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-6">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Right Column */}
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    {
                      question: "Majú vozidlá diaľničnú známku?",
                      answer: "Áno, všetky naše vozidlá majú platnú diaľničnú známku pre Slovensko. Pre ostatné krajiny si diaľničné známky zabezpečte sami."
                    },
                    {
                      question: "Je možná preprava zvierat?",
                      answer: "Preprava zvierat je povolená za dodržania hygienických podmienok. Za dodatočné čistenie vozidla účtujeme poplatok 50€."
                    },
                    {
                      question: "Ako mám postupovať keď viem, že budem meškať?",
                      answer: "Okamžite nás kontaktujte na +421 910 666 949. Meškanie do 1 hodiny je bez poplatku, každá ďalšia hodina je spoplatnená 10€."
                    },
                    {
                      question: "Čo znamená jeden deň prenájmu?",
                      answer: "Jeden deň prenájmu predstavuje 24-hodinové obdobie od času prevzatia vozidla. Prekročenie času je spoplatnené ako ďalší deň."
                    },
                    {
                      question: "Čo ak dostanem pokutu?",
                      answer: "Všetky pokuty a poplatky počas prenájmu znáša nájomca. Administratívny poplatok za vybavenie pokuty je 25€."
                    },
                    {
                      question: "Aké sú podmienky stornácie rezervácie?",
                      answer: "Rezerváciu môžete zrušiť do 24 hodín pred začiatkom prenájmu bez poplatku. Pri neskoršom zrušení účtujeme 50% z ceny prenájmu."
                    }
                  ].map((faq, index) => (
                    <div key={index + 206} className="flex flex-col items-start gap-2 p-6 bg-[#1E1E23] rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleFAQ(index + 206)}
                        className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                            {faq.question}
                          </div>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img 
                            src="/assets/misc/Icon 24 px filled.svg" 
                            alt="Toggle FAQ"
                            className={`w-6 h-6 transition-transform duration-200 ${expandedFAQ[index + 206] ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </button>
                      
                      {expandedFAQ[index + 206] && (
                        <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
                          <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-6">
                            {faq.answer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Contact 1440px */}
            <div className="flex flex-col w-[1120px] items-center pt-16 pb-16 px-8 bg-[#F0F0F5] rounded-2xl mx-auto">
              <div className="relative w-16 h-16 rounded-full p-1 mb-6">
                <img
                  className="w-full h-full rounded-full object-cover"
                  alt="Operátor BlackRent"
                  src="/assets/misc/operator-avatar-728c4b.png"
                />
                <div className="absolute w-3 h-3 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <h3 className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-2xl text-center tracking-[0] leading-8">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-base text-center tracking-[0] leading-6">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img className="relative w-5 h-5" alt="Phone icon" src="/assets/icons/phone-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      +421 910 666 949
                    </span>
                  </a>

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img className="relative w-5 h-5" alt="Email icon" src="/assets/icons/email-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer 1440px */}
            <div className="flex items-start justify-between w-[1120px] px-0 py-20">
              <div className="relative w-[214px] h-8 bg-[#1E1E23]" style={{maskImage: 'url(/assets/brands/blackrent-logo.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/assets/brands/blackrent-logo.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}} aria-label="BlackRent company logo" />
              
              <div className="flex items-start gap-10">
                <div className="flex flex-col items-start gap-10 w-[422px]">
                  <div className="flex flex-col items-start gap-2">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Newsletter
                    </div>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5">
                      Prihláste sa na newsletter a získajte 5€ voucher na prenájom vozidla z našej autopožičovňe.
                    </p>
                  </div>

                  <form onSubmit={handleNewsletterSubmit} className="flex w-[422px] items-center justify-between pl-4 pr-2 py-2 bg-[#1E1E23] rounded-[99px] overflow-hidden">
                    <div className="flex items-center gap-2 flex-1">
                      <img className="relative w-6 h-6" alt="Email icon" src="/assets/icons/message-icon-figma.svg" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Váš e-mail"
                        required
                        className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-6 bg-transparent border-none outline-none placeholder:text-[#646469]"
                        aria-label="Zadajte váš e-mail pre newsletter"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-4 py-2 bg-[#F0FF98] rounded-[99px] hover:bg-[#D7FF14] transition-colors duration-200"
                      aria-label="Potvrdiť prihlásenie na newsletter"
                    >
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#283002] text-sm tracking-[0] leading-6 whitespace-nowrap">Potvrdiť</span>
                      <img className="relative w-4 h-4" alt="Submit arrow icon" src="/assets/misc/arrow-small-down.svg" />
                    </button>
                  </form>
                </div>

                <div className="flex items-start gap-10">
                  <div className="flex flex-col items-start gap-8 w-[195px]">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Mapa stránok</h3>
                    <nav aria-label="Site navigation">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6">
                        {navigationLinks.map((link, index) => (
                          <div key={index} className="mb-1">
                            <a href={link.href} className={`hover:underline transition-colors duration-200 ${link.active ? "text-[#f0ff98] font-medium" : "text-[#FAFAFF] hover:text-[#F0F0F5]"}`}>
                              {link.label}
                            </a>
                          </div>
                        ))}
                      </div>
                    </nav>
                  </div>

                  <div className="flex flex-col items-start gap-10 w-[195px]">
                    <div className="flex flex-col items-start gap-8">
                      <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Sídlo spoločnosti</h3>
                      <address className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-6 not-italic">
                        <p className="m-0">Rozmarínová 211/3</p>
                        <p className="m-0">91101 Trenčín</p>
                        <p className="m-0"><a href="tel:+421910666949" className="text-[#A0A0A5] hover:text-[#F0F0F5] transition-colors duration-200">+421 910 666 949</a></p>
                        <p className="m-0"><a href="mailto:info@blackrent.sk" className="text-[#A0A0A5] hover:text-[#F0F0F5] transition-colors duration-200">info@blackrent.sk</a></p>
                      </address>
                    </div>

                    <div className="flex flex-col items-start gap-8">
                      <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-xl tracking-[0] leading-6">Sledujte nás</h3>
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
                            <img className="relative w-6 h-6" alt={`${social.alt} icon`} src={social.icon} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="flex w-full h-24 items-center gap-2 px-[200px] py-0 bg-black">
              <p className="relative [font-family:'Poppins',Helvetica] font-normal text-[#646469] text-xs tracking-[0] leading-6">
                © 2024 blackrent.sk | {footerLinks.join(" | ")}
              </p>
            </div>
          </div>
        )}

        {/* Tablet 744px */}
        {screenWidth >= 744 && screenWidth < 1440 && (
          <div className="flex flex-col w-full items-center bg-[#0F0F14] rounded-t-[20px]">
            {/* FAQ Section */}
            <div className="flex flex-col w-[680px] items-start gap-8 p-8">
              <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#F0FF98] text-2xl tracking-[0] leading-7 whitespace-nowrap">
                Časté otázky
              </div>

              <div className="flex flex-col gap-4 w-full">
                {[
                  "Čo je zahrnuté v cene prenájmu?",
                  "V akom stave je vozidlo pri odovzdaní?",
                  "Do ktorých krajín môžem vycestovať?",
                  "Môžem cestovať mimo Európskej Únie?",
                  "Ako môžem platiť za prenájom?",
                  "Majú vozidlá diaľničnú známku?",
                  "Je možná preprava zvierat?",
                  "Čo ak dostanem pokutu?"
                ].map((question, index) => (
                  <div key={index + 100} className="flex flex-col items-start gap-3 p-4 bg-[#1E1E23] rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index + 100)}
                      className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 text-left pr-4">
                        {question}
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <img 
                          src="/assets/misc/Icon 24 px filled.svg" 
                          alt="Toggle FAQ"
                          className={`w-6 h-6 transition-transform duration-200 ${expandedFAQ[index + 100] ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    
                    {expandedFAQ[index + 100] && (
                      <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-base leading-6">
                          {index === 0 && "V cene prenájmu je zahrnuté základné poistenie, slovenská diaľničná známka, dane a poplatky."}
                          {index === 1 && "Vozidlo je odovzdané v čistom stave s plnou nádržou paliva a kompletnou výbavou."}
                          {index === 2 && "Môžete cestovať do krajín EÚ podľa zvoleného balíčka. Základný balíček pokrýva Slovensko, Česko a Rakúsko."}
                          {index === 3 && "Cestovanie mimo EÚ je možné po individuálnom posúdení. Kontaktujte nás pre viac informácií."}
                          {index === 4 && "Akceptujeme platby kartou, bankovým prevodom alebo hotovosťou pri prevzatí."}
                          {index === 5 && "Áno, všetky naše vozidlá majú platnú slovenskú diaľničnú známku."}
                          {index === 6 && "Preprava zvierat je možná po predchádzajúcej dohode a za dodržania hygienických podmienok."}
                          {index === 7 && "Pokuty sú účtované nájomcovi spolu s administratívnym poplatkom."}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact Tablet */}
            <div className="flex flex-col w-[680px] items-center gap-6 p-6 bg-[#F0F0F5] rounded-2xl mx-auto">
              <div className="relative w-16 h-16 rounded-full p-1">
                <img
                  className="w-full h-full rounded-full object-cover"
                  alt="Operátor BlackRent"
                  src="/assets/misc/operator-avatar-728c4b.png"
                />
                <div className="absolute w-3 h-3 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <h3 className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-xl text-center tracking-[0] leading-7">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-base text-center tracking-[0] leading-6">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img className="relative w-5 h-5" alt="Phone icon" src="/assets/icons/phone-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      +421 910 666 949
                    </span>
                  </a>

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img className="relative w-5 h-5" alt="Email icon" src="/assets/icons/email-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-base tracking-[0] leading-6">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Tablet */}
            <div className="flex flex-col items-center w-[744px] bg-[#05050A] py-12">
              <div className="flex flex-col items-start w-[680px] px-0 py-0">
                <div className="relative w-[160px] h-6 mb-8 bg-[#1E1E23]" style={{maskImage: 'url(/assets/brands/blackrent-logo.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/assets/brands/blackrent-logo.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}} aria-label="BlackRent company logo" />
                
                <div className="flex flex-col items-start gap-8 w-full">
                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex flex-col items-start gap-2 w-full">
                      <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                        Newsletter
                      </div>
                      <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5">
                        Prihláste sa na newsletter a získajte 5€ voucher.
                      </p>
                    </div>

                    <form onSubmit={handleNewsletterSubmit} className="flex items-center justify-between gap-2 px-3 py-2 w-full bg-[#1E1E23] rounded-[99px]">
                      <div className="flex items-center gap-1 flex-1">
                        <img className="relative w-5 h-5" alt="Email icon" src="/assets/icons/message-icon-figma.svg" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Váš e-mail"
                          required
                          className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-6 bg-transparent border-none outline-none placeholder:text-[#646469]"
                          aria-label="Zadajte váš e-mail pre newsletter"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-[#F0FF98] rounded-[99px] hover:bg-[#D7FF14] transition-colors duration-200"
                        aria-label="Potvrdiť prihlásenie na newsletter"
                      >
                        <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#283002] text-sm tracking-[0] leading-6 whitespace-nowrap">
                          OK
                        </span>
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-col items-start gap-6">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Kontakt
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Rozmarínová 211/3
                      </div>
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        91101 Trenčín
                      </div>
                      <a href="tel:+421910666949" className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap hover:text-[#F0F0F5] transition-colors duration-200">
                        +421 910 666 949
                      </a>
                      <a href="mailto:info@blackrent.sk" className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap hover:text-[#F0F0F5] transition-colors duration-200">
                        info@blackrent.sk
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Sledujte nás
                    </div>
                    <div className="flex items-start gap-3">
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

              {/* Copyright */}
              <div className="flex items-center justify-center w-[744px] h-16 px-4 py-0 bg-black mt-8">
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#646469] text-xs tracking-[0] leading-4 text-center">
                  © 2024 blackrent.sk
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile 360px */}
        {screenWidth < 744 && (
          <div className="flex flex-col w-full items-center bg-[#0F0F14] rounded-t-[20px]">
            {/* FAQ Section */}
            <div className="flex flex-col w-[328px] items-start gap-6 p-4">
              <div className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
                Časté otázky
              </div>

              <div className="flex flex-col gap-3 w-full">
                {[
                  "Čo je zahrnuté v cene prenájmu?",
                  "V akom stave je vozidlo pri odovzdaní?",
                  "Do ktorých krajín môžem vycestovať?",
                  "Môžem cestovať mimo Európskej Únie?",
                  "Ako môžem platiť za prenájom?",
                  "Majú vozidlá diaľničnú známku?",
                  "Je možná preprava zvierat?",
                  "Čo ak dostanem pokutu?"
                ].map((question, index) => (
                  <div key={index + 300} className="flex flex-col items-start gap-2 p-4 bg-[#1E1E23] rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index + 300)}
                      className="flex items-center justify-between w-full cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-sm tracking-[0] leading-5 text-left pr-4">
                        {question}
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <img 
                          src="/assets/misc/Icon 24 px filled.svg" 
                          alt="Toggle FAQ"
                          className={`w-6 h-6 transition-transform duration-200 ${expandedFAQ[index + 300] ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    
                    {expandedFAQ[index + 300] && (
                      <div className="w-full mt-2 pt-2 border-t border-[#37373C]">
                        <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm leading-5">
                          {index === 0 && "V cene prenájmu je zahrnuté základné poistenie, slovenská diaľničná známka, dane a poplatky."}
                          {index === 1 && "Vozidlo je odovzdané v čistom stave s plnou nádržou paliva a kompletnou výbavou."}
                          {index === 2 && "Môžete cestovať do krajín EÚ podľa zvoleného balíčka. Základný balíček pokrýva Slovensko, Česko a Rakúsko."}
                          {index === 3 && "Cestovanie mimo EÚ je možné po individuálnom posúdení. Kontaktujte nás pre viac informácií."}
                          {index === 4 && "Akceptujeme platby kartou, bankovým prevodom alebo hotovosťou pri prevzatí."}
                          {index === 5 && "Áno, všetky naše vozidlá majú platnú slovenskú diaľničnú známku."}
                          {index === 6 && "Preprava zvierat je možná po predchádzajúcej dohode a za dodržania hygienických podmienok."}
                          {index === 7 && "Pokuty sú účtované nájomcovi spolu s administratívnym poplatkom."}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Contact Mobile */}
            <div className="flex flex-col w-[328px] items-center gap-6 p-6 bg-[#F0F0F5] rounded-2xl mx-auto">
              <div className="relative w-16 h-16 rounded-full p-1">
                <img
                  className="w-full h-full rounded-full object-cover"
                  alt="Operátor BlackRent"
                  src="/assets/misc/operator-avatar-728c4b.png"
                />
                <div className="absolute w-3 h-3 bottom-1 right-1 bg-[#3CEB82] rounded-full border border-solid border-[#F0F0F5]" />
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <h3 className="[font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-lg text-center tracking-[0] leading-6">
                    Potrebujete poradiť? Sme tu pre vás.
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-medium text-[#A0A0A5] text-sm text-center tracking-[0] leading-5">
                    Sme na príjme Po–Pia 08:00–17:00
                  </p>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <a
                    href="tel:+421910666949"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Zavolajte nám na číslo +421 910 666 949"
                  >
                    <img className="relative w-5 h-5" alt="Phone icon" src="/assets/icons/phone-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-5">
                      +421 910 666 949
                    </span>
                  </a>

                  <a
                    href="mailto:info@blackrent.sk"
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    aria-label="Napíšte nám e-mail na info@blackrent.sk"
                  >
                    <img className="relative w-5 h-5" alt="Email icon" src="/assets/icons/email-icon.svg" />
                    <span className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-5">
                      info@blackrent.sk
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Mobile */}
            <div className="flex flex-col items-center w-[360px] bg-[#05050A] py-12">
              <div className="flex flex-col items-start w-[328px] px-0 py-0">
                <div className="relative w-[160px] h-6 mb-8 bg-[#1E1E23]" style={{maskImage: 'url(/assets/brands/blackrent-logo.svg)', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url(/assets/brands/blackrent-logo.svg)', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center'}} aria-label="BlackRent company logo" />
                
                <div className="flex flex-col items-start gap-8 w-full">
                  <div className="flex flex-col items-start gap-6 w-full">
                    <div className="flex flex-col items-start gap-2 w-full">
                      <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                        Newsletter
                      </div>
                      <p className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5">
                        Prihláste sa na newsletter a získajte 5€ voucher.
                      </p>
                    </div>

                    <form onSubmit={handleNewsletterSubmit} className="flex items-center justify-between gap-2 px-3 py-2 w-full bg-[#1E1E23] rounded-[99px]">
                      <div className="flex items-center gap-1 flex-1">
                        <img className="relative w-5 h-5" alt="Email icon" src="/assets/icons/message-icon-figma.svg" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Váš e-mail"
                          required
                          className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm tracking-[0] leading-6 bg-transparent border-none outline-none placeholder:text-[#646469]"
                          aria-label="Zadajte váš e-mail pre newsletter"
                        />
                      </div>
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-1 px-4 py-2 bg-[#F0FF98] rounded-[99px] hover:bg-[#D7FF14] transition-colors duration-200"
                        aria-label="Potvrdiť prihlásenie na newsletter"
                      >
                        <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#283002] text-sm tracking-[0] leading-6 whitespace-nowrap">
                          OK
                        </span>
                      </button>
                    </form>
                  </div>

                  <div className="flex flex-col items-start gap-6">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Kontakt
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Rozmarínová 211/3
                      </div>
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        91101 Trenčín
                      </div>
                      <a href="tel:+421910666949" className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap hover:text-[#F0F0F5] transition-colors duration-200">
                        +421 910 666 949
                      </a>
                      <a href="mailto:info@blackrent.sk" className="[font-family:'Poppins',Helvetica] font-normal text-[#A0A0A5] text-sm tracking-[0] leading-5 whitespace-nowrap hover:text-[#F0F0F5] transition-colors duration-200">
                        info@blackrent.sk
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3">
                    <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#F0F0F5] text-lg tracking-[0] leading-6 whitespace-nowrap">
                      Sledujte nás
                    </div>
                    <div className="flex items-start gap-3">
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

              {/* Copyright */}
              <div className="flex items-center justify-center w-[360px] h-16 px-4 py-0 bg-black mt-8">
                <p className="[font-family:'Poppins',Helvetica] font-normal text-[#646469] text-xs tracking-[0] leading-4 text-center">
                  © 2024 blackrent.sk
                </p>
              </div>
            </div>
          </div>
        )}
    </>
  );
};