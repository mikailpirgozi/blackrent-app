import React from "react";
import Link from "next/link";
import { Button } from "../../../ui/Button";
import { Card, CardContent } from "../../../ui/card";
import { Badge } from "../../../ui/badge";


const searchFields = [
  {
    icon: "/assets/misc/icon-pin-24px.svg",
    placeholder: "Miesto vyzdvihnutia"
  },
  {
    icon: "/assets/misc/icon-calendar-24px.svg",
    placeholder: "Dátum vyzdvihnutia"
  },
  {
    icon: "/assets/misc/icon-calendar-24px.svg",
    placeholder: "Dátum vrátenia"
  }
];

const leftImages = [
  {
    className: "w-[144px] h-[144px] top-[392px] left-0 rounded-lg bg-[url(/assets/misc/hero-left-1.png)] bg-cover bg-center"
  },
  {
    className: "w-[184px] h-[184px] top-[176px] left-0 bg-[url(/assets/misc/hero-left-2.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[144px] h-[144px] top-0 left-0 bg-[url(/assets/misc/hero-left-3.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[104px] h-[104px] top-[320px] left-[216px] bg-[url(/assets/misc/hero-left-4.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[144px] h-[144px] top-[144px] left-[216px] bg-[url(/assets/misc/hero-left-5.png)] bg-cover bg-center rounded-lg"
  }
];

const rightImages = [
  {
    className: "w-[144px] h-[144px] top-[392px] left-[216px] bg-[url(/assets/misc/hero-right-1.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[184px] h-[184px] top-[176px] left-[176px] bg-[url(/assets/misc/hero-right-2.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[144px] h-[144px] top-0 left-[216px] bg-[url(/assets/misc/hero-right-3.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[104px] h-[104px] top-[112px] left-[40px] bg-[url(/assets/misc/hero-right-4.png)] bg-cover bg-center rounded-lg"
  },
  {
    className: "w-[144px] h-[144px] top-[248px] left-0 bg-[url(/assets/misc/hero-right-5.png)] bg-cover bg-center rounded-lg"
  }
];

const vehicleCards = [
  {
    id: "vozidlo-1",
    background: "bg-[#141419]",
    image: "/assets/misc/n-h-ad-vozidla.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "icon"
  },
  {
    id: "vozidlo-2",
    background: "bg-[#1e1e23]",
    image: "/assets/misc/n-h-ad-vozidla-1.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "image",
    buttonSrc: "/assets/misc/tla--tko.png"
  },
  {
    id: "vozidlo-3",
    background: "bg-[#141419]",
    image: "/assets/misc/n-h-ad-vozidla-4.png",
    badges: [
      { text: "Možný odpočet DPH", className: "bg-[#f0f0f5] text-[#1e1e23]" }
    ],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "icon"
  },
  {
    id: "vozidlo-4",
    background: "bg-[#141419]",
    image: "/assets/misc/n-h-ad-vozidla-10.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "icon"
  },
  {
    id: "vozidlo-5",
    background: "bg-[#141419]",
    image: "/assets/misc/n-h-ad-vozidla-12.png",
    badges: [
      { text: "-25%", className: "bg-[#d7ff14] text-[#141900]" },
      { text: "Možný odpočet DPH", className: "bg-[#f0f0f5] text-[#1e1e23]" }
    ],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od ",
      originalPrice: "123€",
      price: "89€",
      period: "/deň"
    },
    buttonType: "icon"
  },
  {
    id: "vozidlo-6",
    background: "bg-[#141419]",
    image: "/assets/misc/n-h-ad-vozidla-14.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "icon"
  }
];

const brandLogos = [
  { src: "/assets/logos/audi-logo.svg", className: "" },
  { src: "/assets/logos/bmw-logo.svg", className: "" },
  { src: "/assets/logos/mercedes-logo.svg", className: "" },
  { src: "/assets/logos/volkswagen-logo.svg", className: "" },
  { src: "/assets/logos/tesla-logo.svg", className: "" },
  { src: "/assets/logos/ford-logo.svg", className: "" },
  { src: "/assets/logos/porsche-logo.svg", className: "" },
  { src: "/assets/logos/skoda-logo.svg", className: "" },
  { src: "/assets/logos/opel-logo.svg", className: "" },
  { src: "/assets/logos/hyundai-logo.svg", className: "" },
  { src: "/assets/logos/nissan-logo.svg", className: "" },
  { src: "/assets/logos/jaguar-logo.svg", className: "" },
  { src: "/assets/logos/chevrolet-logo.svg", className: "" },
  { src: "/assets/logos/dodge-logo.svg", className: "" },
  { src: "/assets/logos/mustang-logo.svg", className: "" },
  { src: "/assets/logos/iveco-logo.svg", className: "" }
];

export const FeaturedItemsSection = (): JSX.Element => {
  return (
    <section className="w-full min-h-screen bg-[#05050a] relative overflow-hidden">

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row w-full max-w-[360px] md:max-w-[744px] lg:max-w-[1440px] xl:max-w-[1728px] mx-auto items-center justify-between px-4 md:px-8 py-8 lg:py-16 relative z-10 gap-8 lg:gap-14">
        {/* Left Images - Only visible on 1728px+ */}
        <div className="hidden xl:block relative w-[360px] h-[536px] flex-shrink-0">
          {leftImages.map((image, index) => (
            <div key={index} className={`absolute ${image.className}`} />
          ))}
        </div>

        {/* Center Content */}
        <div className="flex flex-col items-center gap-6 lg:gap-10 flex-1 max-w-4xl lg:max-w-[800px] mx-0 lg:mx-auto pt-8">
          {/* Frame 2608582 - Text Section */}
          <div className="flex flex-col items-center gap-6 lg:gap-10">
            <div className="text-center">
              <h1 className="text-2xl md:text-2xl lg:text-[48px] font-[540] lg:font-medium text-[#F0FF98] [font-family:'SF_Pro',Helvetica] leading-8 lg:leading-[64px] text-center mb-4">
                Autá pre každodennú potrebu,<br />aj nezabudnuteľný zážitok
              </h1>
            </div>
            <p className="max-w-[562px] [font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-sm md:text-sm lg:text-[16px] text-center tracking-[0] leading-5 lg:leading-[24px] px-4 lg:px-0">
              Spolupracujeme s desiatkami preverených autopožičovní na slovensku s ponukou vyše 100+ vozidiel
            </p>
          </div>

          {/* Frame 2608583 - Buttons Section */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 lg:gap-6">
            <Link href="/vozidla">
              <Button className="inline-flex items-center gap-2 pl-6 pr-1 py-1 bg-[#f0ff98] rounded-[99px] backdrop-blur-[40px] hover:bg-[#e8ff80] h-auto">
                <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#141900] text-[14px] tracking-[0] leading-[32px] whitespace-nowrap">
                  Ponuka vozidiel
                </div>
                <div className="flex w-8 h-8 items-center justify-center bg-[#141900] rounded-[99px]">
                  <img
                    className="w-6 h-6"
                    alt="Arrow icon"
                    src="/assets/misc/icon-arrow-top-right-24px.svg"
                  />
                </div>
              </Button>
            </Link>
            <Button className="inline-flex items-center gap-2.5 px-6 py-1 bg-[#28282d] rounded-[99px] backdrop-blur-[40px] hover:bg-[#323238] h-10">
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#f0f0f5] text-[14px] tracking-[0] leading-[32px] whitespace-nowrap">
                Naše služby
              </div>
            </Button>
          </div>
        </div>

        {/* Right Images - Only visible on 1728px+ */}
        <div className="hidden xl:block relative w-[360px] h-[536px] flex-shrink-0">
          {rightImages.map((image, index) => (
            <div key={index} className={`absolute ${image.className}`} />
          ))}
        </div>
      </div>

      {/* Search Card */}
      <div className="flex justify-center px-4 md:px-8 py-8 lg:py-16">
        <Card className="w-full max-w-[1102px] bg-gradient-to-b from-[#1e1e23] to-[#0a0a0f] rounded-2xl lg:rounded-3xl border border-[#1e1e23] p-4 md:p-6 lg:p-8">
          <CardContent className="p-0 space-y-4 lg:space-y-6">
            <div className="space-y-2 lg:space-y-4">
              <h1 className="[font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-xl md:text-2xl lg:text-[32px] tracking-[0] leading-tight">
                Požičajte si auto už dnes
              </h1>
              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-xs md:text-sm tracking-[0] leading-6">
                ✅ Rýchlo, jednoducho a bez skrytých poplatkov
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 p-4 lg:p-6 bg-[#141419] rounded-xl lg:rounded-2xl">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6 flex-1">
                {searchFields.map((field, index) => (
                  <div key={index} className="flex h-14 lg:h-16 items-center gap-3 px-4 lg:px-6 py-3 flex-1 bg-[#1e1e23] rounded-lg min-w-[200px] lg:min-w-[240px]">
                    <img
                      className="w-6 lg:w-7 h-6 lg:h-7"
                      alt="Icon px"
                      src={field.icon}
                    />
                    <div className="flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#bebec3] text-sm lg:text-base tracking-[0] leading-6">
                      {field.placeholder}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="inline-flex h-14 lg:h-16 items-center gap-2 px-6 lg:px-8 py-3 bg-[#d7ff14] rounded-[99px] hover:bg-[#c9f000] min-w-[140px] lg:min-w-[160px]">
                <span className="font-semibold text-[#141900] text-sm lg:text-base [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                  Vyhľadať
                </span>
                <img
                  className="w-6 lg:w-7 h-6 lg:h-7"
                  alt="Icon px"
                  src="/assets/misc/icon-search-dark-24px.svg"
                />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brand Logos */}
      <div className="flex justify-center px-4 md:px-8 py-8 lg:py-16">
        <div className="relative w-full max-w-7xl overflow-hidden">
          <div className="flex items-center gap-8 md:gap-12 lg:gap-16 animate-scroll">
            {/* Prvá sada logov */}
            {brandLogos.map((logo, index) => (
              <img
                key={`first-${index}`}
                className="w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 object-contain opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                alt="Brand logo"
                src={logo.src}
              />
            ))}
            {/* Duplikovaná sada pre seamless loop */}
            {brandLogos.map((logo, index) => (
              <img
                key={`second-${index}`}
                className="w-16 md:w-20 lg:w-24 h-16 md:h-20 lg:h-24 object-contain opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                alt="Brand logo"
                src={logo.src}
              />
            ))}
          </div>
          <div className="absolute left-0 top-0 w-16 md:w-24 lg:w-32 h-full bg-gradient-to-r from-[#05050a] to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 w-16 md:w-24 lg:w-32 h-full bg-gradient-to-l from-[#05050a] to-transparent pointer-events-none z-10" />
        </div>
      </div>

      {/* Vehicle Cards */}
      <div className="flex flex-col items-center py-8 lg:py-16">
        <div className="flex flex-wrap justify-center gap-[31px] w-[1728px] max-w-full px-4">
          {vehicleCards.map((card, index) => (
            <Link key={index} href={`/vozidla/${card.id}`} className="block">
              <Card className="bg-[#141419] rounded-[24px] border-0 overflow-hidden group hover:scale-105 transition-transform duration-300 w-[422px] h-[424px] cursor-pointer">
              <CardContent className="p-4 flex flex-col h-full gap-[14px]">
                <div 
                  className="relative flex-1 rounded-lg overflow-hidden bg-cover bg-center p-2"
                  style={{ backgroundImage: `url(${card.image})` }}
                >
                  {card.badges.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {card.badges.map((badge, badgeIndex) => (
                        <Badge key={badgeIndex} className={`${badge.className} rounded-full px-3 py-1 text-xs font-medium h-6`}>
                          {badge.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between flex-1 pl-4 gap-[3px]">
                  <div className="flex flex-col gap-4">
                    <h3 className="[font-family:'SF_Pro',Helvetica] font-[650] text-[#f0ff98] text-2xl tracking-[0] leading-[28px] overflow-hidden text-ellipsis whitespace-nowrap">
                      {card.title}
                    </h3>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-xs tracking-[0] leading-[24px]">
                      {card.specs}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-28">
                    <div className="flex flex-col pr-2 pb-4 flex-1 h-16 justify-center">
                      <div className="[font-family:'Poppins',Helvetica]">
                        <span className="font-semibold text-[#f0f0f5] text-xl leading-[24px]">{card.pricing.from} </span>
                        {card.pricing.originalPrice && (
                          <span className="font-semibold text-[#646469] text-xl line-through mr-2">
                            {card.pricing.originalPrice}
                          </span>
                        )}
                        <span className={`font-semibold text-xl leading-[24px] ${card.pricing.originalPrice ? 'text-[#d7ff14]' : 'text-[#f0f0f5]'}`}>
                          {card.pricing.price}
                        </span>
                        <span className="text-[#f0f0f5] text-xl leading-[24px]">{card.pricing.period}</span>
                      </div>
                    </div>

                    <Button className="w-16 h-16 p-0 bg-[#1e1e23] rounded-full hover:bg-[#d7ff14] group-hover:bg-[#d7ff14] transition-colors duration-300 flex items-center justify-center">
                      <img
                        className="w-8 h-8 group-hover:filter group-hover:brightness-0 transition-all duration-300"
                        alt="Icon px"
                        src="/assets/misc/icon-32-px-arrow-top-right.svg"
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* Centered "Všetky vozidlá" button */}
        <div className="mt-8 lg:mt-12">
          <Link href="/vozidla">
            <Button className="inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 bg-[#d7ff14] rounded-[99px] hover:bg-[#c9f000]">
              <span className="font-semibold text-[#141900] text-base [font-family:'Poppins',Helvetica] leading-6 whitespace-nowrap">
                Všetky vozidlá
              </span>
              <img
                className="w-6 h-6"
                alt="Icon px"
                src="/assets/misc/icon-24-px-9.svg"
              />
            </Button>
          </Link>
        </div>
      </div>


    </section>
  );
};