import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "../../../ui/accordion";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";
import { Input } from "../../../ui/input";
import Icon24PxFilled from "../../../firejet/assets/Icon24PxFilled";
import { cn } from "../../../../lib/utils";

// Custom AccordionTrigger without default icon
const CustomAccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]_.accordion-icon]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
CustomAccordionTrigger.displayName = "CustomAccordionTrigger";

const faqData = [
  {
    leftColumn: [
      "Čo je zahrnuté v cene prenájmu?",
      "V akom stave je vozidlo pri odovzdaní nájomcovi?",
      "Do ktorých krajín môžem s vozidlom vycestovať?",
      "Môžem cestovať aj do krajín mimo Európskej Únie?",
      "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
      "Ako môžem platiť za prenájom vozidla?",
    ],
    rightColumn: [
      "Majú vozidlá diaľničnú známku?",
      "Je možná preprava zvierat?",
      "Ako mám postupovať keď viem, že budem meškať?",
      "Čo znamená jeden deň prenájmu?",
      "Čo ak dostanem pokutu?",
    ],
  },
];

const socialIcons = [
  "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-14.svg",
  "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-3.svg",
  "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-5.svg",
];

export const ContactSection = (): JSX.Element => {
  return (
    <section className="flex flex-col items-center bg-[#0f0f14] rounded-[40px_40px_0px_0px] relative">
      <div className="flex flex-col w-full max-w-[1728px] items-center gap-2 pt-16 md:pt-24 lg:pt-[200px] pb-32 md:pb-48 lg:pb-60 px-2 bg-[#0f0f14] rounded-[40px_40px_0px_0px] overflow-hidden">
        <div className="flex flex-col items-center gap-16 lg:gap-[120px] px-4 md:px-8">
          <h2 className="max-w-[300px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-[650] text-[#f0ff98] text-2xl md:text-3xl lg:text-[40px] text-center tracking-[0] leading-tight lg:leading-6">
            Časté otázky
          </h2>

          <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 w-full max-w-6xl mx-auto px-4 md:px-8">
            <div className="flex flex-col w-full lg:w-1/2 items-start gap-4">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqData[0].leftColumn.map((question, index) => (
                  <AccordionItem
                    key={`left-${index}`}
                    value={`left-item-${index}`}
                    className="bg-[#1e1e23] rounded-lg border-none"
                  >
                    <CustomAccordionTrigger className="flex items-center justify-between px-4 md:px-6 py-4 hover:no-underline [&[data-state=open]_.accordion-icon]:rotate-180">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-sm md:text-base tracking-[0] leading-6 text-left pr-4">
                        {question}
                      </span>
                      <Icon24PxFilled className="accordion-icon h-6 w-6 shrink-0 transition-transform duration-200" />
                    </CustomAccordionTrigger>
                    <AccordionContent className="px-4 md:px-6 pb-4">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm md:text-base">
                        Content for {question}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex flex-col w-full lg:w-1/2 items-start gap-4">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqData[0].rightColumn.map((question, index) => (
                  <AccordionItem
                    key={`right-${index}`}
                    value={`right-item-${index}`}
                    className="bg-[#1e1e23] rounded-lg border-none"
                  >
                    <CustomAccordionTrigger className="flex items-center justify-between px-4 md:px-6 py-4 hover:no-underline [&[data-state=open]_.accordion-icon]:rotate-180">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-sm md:text-base tracking-[0] leading-6 text-left pr-4">
                        {question}
                      </span>
                      <Icon24PxFilled className="accordion-icon h-6 w-6 shrink-0 transition-transform duration-200" />
                    </CustomAccordionTrigger>
                    <AccordionContent className="px-4 md:px-6 pb-4">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm md:text-base">
                        Content for {question}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center pt-0 pb-0 px-0 relative">
        {/* Rýchly kontakt card - moved outside footer */}
        <Card className="absolute bottom-[1100px] md:bottom-[1300px] lg:bottom-[992px] left-1/2 transform -translate-x-1/2 flex flex-col w-[95%] md:w-[90%] lg:w-full max-w-[1328px] items-center pt-16 md:pt-20 lg:pt-24 pb-12 md:pb-16 lg:pb-[72px] px-4 md:px-6 lg:px-0 bg-[#f0f0f5] rounded-2xl lg:rounded-3xl border-none overflow-hidden z-20">
          <CardContent className="relative w-full p-0">
            <div 
              className="absolute w-[80px] md:w-[90px] lg:w-[104px] h-[80px] md:h-[90px] lg:h-[104px] left-1/2 md:left-[55%] lg:left-[612px] top-[-60px] md:top-[-80px] lg:top-[-144px] transform -translate-x-1/2 md:transform-none lg:transform-none rounded-[99px] border border-solid border-[#f0f0f5] bg-[url(/figma-assets/operator-avatar.webp)] bg-no-repeat bg-[0px_-7.084px] bg-[length:100%_149.982%]"
              style={{
                display: 'flex',
                padding: '8px',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '8px',
                borderRadius: '99px',
                border: '1px solid var(--White-800, #F0F0F5)',
                background: 'url(/figma-assets/operator-avatar.webp) lightgray 0px -7.084px / 100% 149.982% no-repeat'
              }}
            />

            <div className="absolute w-3 md:w-3.5 h-3 md:h-3.5 top-[-35px] md:top-[-50px] lg:top-[-65px] left-[calc(50%+25px)] md:left-[calc(55%+30px)] lg:left-[690px] bg-[#3ceb82] rounded-[7px] border border-solid border-[#f0f0f5]" />

            <div className="flex flex-col items-center gap-6 md:gap-8 lg:gap-10">
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <h2 className="w-full max-w-[874px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-[650] text-[#283002] text-xl md:text-2xl lg:text-[32px] text-center tracking-[0] leading-tight lg:leading-8">
                  Potrebujete poradiť? Sme tu pre vás.
                </h2>

                <p className="w-full max-w-[874px] [font-family:'Poppins',Helvetica] font-medium text-[#a0a0a5] text-sm md:text-base text-center tracking-[0] leading-6">
                  Sme na príjme Po–Pia 08:00–17:00
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-4 w-full">
                <div className="flex items-center justify-center gap-2">
                  <img
                    className="w-5 md:w-6 h-5 md:h-6"
                    alt="Phone icon"
                    src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-1.svg"
                  />
                  <a
                    className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-lg md:text-xl tracking-[0] leading-6 whitespace-nowrap"
                    href="tel:+421 910 666 949"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    +421 910 666 949
                  </a>
                </div>

                <img
                  className="hidden md:block self-stretch w-px"
                  alt="Line"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/line-9.svg"
                />

                <div className="flex items-center gap-2">
                  <img
                    className="w-5 md:w-6 h-5 md:h-6"
                    alt="Email icon"
                    src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px.svg"
                  />
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-[#646469] text-lg md:text-xl tracking-[0] leading-6 whitespace-nowrap">
                    info@blackrent.sk
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute w-[200px] h-[210px] bottom-[-50px] left-[-120px] rounded-3xl overflow-hidden">
              <div className="w-full h-full bg-[url(/assets/contact-pattern.svg)] bg-no-repeat bg-cover" />
            </div>
          </CardContent>
        </Card>

        <footer className="w-full bg-[#05050a] overflow-hidden relative mt-48">
          <div className="w-full max-w-7xl lg:ml-0 lg:mr-auto px-4 md:px-8 py-16 md:py-20 lg:py-24 relative">
            {/* Background vector - hidden on mobile */}
            <div className="hidden lg:block absolute w-[476px] h-[904px] top-0 right-0">
              <img
                className="w-full h-full"
                alt="Vector"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/vector.svg"
              />
            </div>

            <div className="flex flex-col gap-12 lg:gap-16 relative z-10">
              {/* Logo */}
              <img
                className="w-[214.4px] h-8 mx-auto lg:mx-0 lg:ml-0"
                alt="Blackrent logo"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/blackrent-logo.svg"
              />

              <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                {/* Newsletter Section */}
                <div className="flex flex-col gap-8 lg:w-[422px] lg:mr-auto">
                  <div className="flex flex-col gap-6">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 text-center lg:text-left">
                      Newsletter
                    </h3>

                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-6 text-center lg:text-left">
                      Prihláste sa na newsletter a získajte <span className="font-semibold">5€ voucher</span>!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row w-full items-center justify-between pl-4 pr-2 py-2 bg-[#1e1e23] rounded-[99px] overflow-hidden gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                      <img
                        className="w-6 h-6"
                        alt="Icon px"
                        src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px.svg"
                      />
                      <Input
                        placeholder="Váš e-mail"
                        className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-sm bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>

                    <Button className="gap-1.5 px-5 py-2 bg-[#d7ff14] rounded-[99px] hover:bg-[#c7ef04] h-auto w-full sm:w-auto">
                      <span className="font-semibold text-[#141900] text-sm [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                        Potvrdiť
                      </span>
                      <img
                        className="w-4 h-4"
                        alt="Icon px"
                        src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-16-px-4.svg"
                      />
                    </Button>
                  </div>
                </div>

                {/* Navigation sections */}
                <div className="flex flex-col md:flex-row gap-12 md:gap-8 lg:gap-16 flex-1">
                  {/* Mapa stránok */}
                  <div className="flex flex-col gap-8 flex-1">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 text-center md:text-left">
                      Mapa stránok
                    </h3>

                    <nav className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-6 text-center md:text-left space-y-2">
                      <div>Ponuka vozidiel</div>
                      <div>Store</div>
                      <div className="text-[#f0ff98]">O nás</div>
                      <div>Kontakt</div>
                      <div>Prihlásenie / Registrácia</div>
                    </nav>
                  </div>

                  {/* Kontaktné informácie */}
                  <div className="flex flex-col gap-8 flex-1">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 text-center md:text-left">
                      Kontaktné informácie
                    </h3>

                    <address className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-6 not-italic text-center md:text-left space-y-1">
                      <div>Rozmarínová 211/3</div>
                      <div>91101 Trenčín</div>
                      <div>+421 910 666 949</div>
                      <div>info@blackrent.sk</div>
                    </address>
                  </div>

                  {/* Sledujte nás */}
                  <div className="flex flex-col gap-8 flex-1">
                    <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 text-center md:text-left">
                      Sledujte nás
                    </h3>

                    <div className="flex items-center justify-center md:justify-start gap-4">
                      {socialIcons.map((iconSrc, index) => (
                        <img
                          key={index}
                          className="w-6 h-6"
                          alt="Social icon"
                          src={iconSrc}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>

        <div className="flex w-full items-center justify-center py-6 lg:py-8 px-4 md:px-8 bg-black">
          <div className="[font-family:'Poppins',Helvetica] font-normal text-[#37373c] text-xs tracking-[0] leading-6 text-center">
            © 2024 blackrent.sk | Obchodné podmienky | Pravidlá pre súbory cookies | Reklamačný poriadok | Ochrana osobných údajov
          </div>
        </div>
      </div>
    </section>
  );
};
