import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../../components/ui/accordion";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";

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
    <section className="flex flex-col items-center bg-[#0f0f14] rounded-[40px_40px_0px_0px]">
      <div className="flex flex-col w-full max-w-[1728px] items-center gap-2 pt-[200px] pb-60 px-2 bg-[#0f0f14] rounded-[40px_40px_0px_0px] overflow-hidden">
        <div className="flex flex-col items-center gap-[120px]">
          <h2 className="w-[300px] h-6 [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#f0ff98] text-[40px] text-center tracking-[0] leading-6 whitespace-nowrap">
            Časté otázky
          </h2>

          <div className="flex items-start gap-8">
            <div className="flex flex-col w-[567px] items-start gap-4">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqData[0].leftColumn.map((question, index) => (
                  <AccordionItem
                    key={`left-${index}`}
                    value={`left-item-${index}`}
                    className="bg-[#1e1e23] rounded-lg border-none"
                  >
                    <AccordionTrigger className="flex items-center justify-between px-6 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-sm tracking-[0] leading-6 text-left">
                        {question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm">
                        Content for {question}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex flex-col w-[567px] items-start gap-4">
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqData[0].rightColumn.map((question, index) => (
                  <AccordionItem
                    key={`right-${index}`}
                    value={`right-item-${index}`}
                    className="bg-[#1e1e23] rounded-lg border-none"
                  >
                    <AccordionTrigger className="flex items-center justify-between px-6 py-4 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                      <span className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-sm tracking-[0] leading-6 text-left">
                        {question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm">
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

      <div className="flex flex-col items-center pt-56 pb-0 px-0">
        <footer className="w-full max-w-[1728px] h-[824px] bg-[#05050a] overflow-hidden relative">
          <div className="w-[1528px] h-[1068px] ml-[200px] relative">
            <div className="absolute w-[476px] h-[1068px] top-0 left-[1052px]">
              <img
                className="absolute w-[476px] h-[904px] top-0 left-0"
                alt="Vector"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/vector.svg"
              />
            </div>

            <div className="flex flex-col items-start gap-20 absolute top-[336px] left-0">
              <img
                className="w-[214.4px] h-8"
                alt="Blackrent logo"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/blackrent-logo.svg"
              />

              <div className="flex w-[1328px] items-start gap-[258px]">
                <div className="flex flex-col w-[422px] items-start gap-10">
                  <div className="flex flex-col items-start gap-8 w-full">
                    <h3 className="w-[109px] h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Newsletter
                    </h3>

                    <p className="w-full h-8 [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[14px]">
                      <span className="text-[#a0a0a5] leading-[0.1px]">
                        Prihláste sa na newsletter a získajte{" "}
                      </span>
                      <span className="font-semibold text-[#a0a0a5] leading-5">
                        5€ voucher{" "}
                      </span>
                      <span className="text-[#a0a0a5] leading-[0.1px]">
                        na prenájom vozidla z našej autopožičovňe.
                      </span>
                    </p>
                  </div>

                  <div className="flex w-[422px] items-center justify-between pl-4 pr-2 py-2 bg-[#1e1e23] rounded-[99px] overflow-hidden">
                    <div className="flex items-center gap-2 flex-1">
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

                    <Button className="h-10 gap-1.5 px-5 py-2 bg-[#d7ff14] rounded-[99px] hover:bg-[#c7ef04] h-auto">
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

                <div className="flex items-start justify-between flex-1">
                  <div className="flex flex-col w-[195px] items-start gap-8">
                    <h3 className="w-full h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                      Mapa stránok
                    </h3>

                    <nav className="w-full [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-6">
                      <span className="text-[#a0a0a5]">
                        Ponuka vozidiel <br />
                        Služby
                        <br />
                        Store
                        <br />
                        Kontakt
                        <br />
                      </span>
                      <span className="text-[#f0ff98]">O nás</span>
                      <span className="text-[#e4ff56]">&nbsp;</span>
                      <span className="text-[#a0a0a5]">
                        {"  "}Prihlásenie a Registrácia
                      </span>
                    </nav>
                  </div>

                  <div className="flex flex-col w-[195px] items-start gap-10">
                    <div className="flex flex-col items-start gap-8">
                      <h3 className="w-full h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                        Sídlo spoločnosti
                      </h3>

                      <address className="w-full [font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-6 not-italic">
                        Rozmarínová 211/3
                        <br />
                        91101 Trenčín
                        <br />
                        +421 910 666 949
                        <br />
                        info@blackrent.sk
                      </address>
                    </div>
                  </div>

                  <div className="flex flex-col w-[195px] items-start gap-8">
                    <div className="flex flex-col items-start gap-10">
                      <h3 className="w-full h-4 [font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl tracking-[0] leading-6 whitespace-nowrap">
                        Sledujte nás
                      </h3>
                    </div>

                    <div className="flex items-start gap-4">
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

        <div className="flex w-full max-w-[1728px] h-24 items-center gap-2 px-[200px] py-0 bg-black">
          <div className="w-[855px] h-2 [font-family:'Poppins',Helvetica] font-normal text-[#37373c] text-xs tracking-[0] leading-6 whitespace-nowrap">
            © 2024 blackrent.sk | Obchodné podmienky | Pravidlá pre súbory
            cookies | Reklamačný poriadok |&nbsp;&nbsp;Ochrana osobných údajov
          </div>
        </div>

        <Card className="flex flex-col w-[1328px] items-center pt-24 pb-[72px] px-0 absolute top-12 left-[200px] bg-[#f0f0f5] rounded-3xl border-none">
          <CardContent className="relative w-full p-0">
            <div className="absolute w-[104px] h-[104px] -top-12 left-[612px] rounded-[99px] border border-solid border-[#f0f0f5] bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/fotka-oper-tora.png)] bg-cover bg-[50%_50%]" />

            <div className="absolute w-3.5 h-3.5 top-[29px] left-[697px] bg-[#3ceb82] rounded-[7px] border border-solid border-[#f0f0f5]" />

            <div className="flex flex-col items-center gap-10">
              <div className="flex flex-col items-start gap-4">
                <h2 className="w-[874px] h-6 [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#283002] text-[32px] text-center tracking-[0] leading-6 whitespace-nowrap">
                  Potrebujete poradiť? Sme tu pre vás.
                </h2>

                <p className="w-[874px] h-4 [font-family:'Poppins',Helvetica] font-medium text-[#a0a0a5] text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                  Sme na príjme Po–Pia 08:00–17:00
                </p>
              </div>

              <div className="flex h-10 items-center justify-center gap-4 w-full">
                <div className="flex items-center justify-center gap-2">
                  <img
                    className="w-6 h-6"
                    alt="Phone icon"
                    src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-1.svg"
                  />

                  <div className="flex flex-col items-start gap-4">
                    <a
                      className="w-fit [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap"
                      href="tel:+421 910 666 949"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      +421 910 666 949
                    </a>
                  </div>
                </div>

                <img
                  className="self-stretch w-px"
                  alt="Line"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/line-9.svg"
                />

                <div className="flex items-center gap-2">
                  <img
                    className="w-6 h-6"
                    alt="Email icon"
                    src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px.svg"
                  />

                  <div className="flex flex-col items-start gap-4">
                    <div className="w-fit [font-family:'Poppins',Helvetica] font-medium text-[#646469] text-xl tracking-[0] leading-6 whitespace-nowrap">
                      info@blackrent.sk
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute w-[304px] h-[304px] top-0 left-0 rounded-3xl overflow-hidden">
              <div className="w-[294px] h-[660px] bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/vector-1.svg)] bg-[100%_100%]" />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
