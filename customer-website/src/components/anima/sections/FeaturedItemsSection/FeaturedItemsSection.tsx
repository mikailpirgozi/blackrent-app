import React from "react";
import { Button } from "../../../ui/Button";
import { Card, CardContent } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "../../../ui/navigation-menu";

const navigationItems = [
  { label: "Ponuka vozidiel", href: "#" },
  { label: "Služby", href: "#" },
  { label: "Store", href: "#" },
  { label: "O nás", href: "#" },
  { label: "Kontakt", href: "#" }
];

const searchFields = [
  {
    icon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-2.svg",
    placeholder: "Miesto vyzdvihnutia"
  },
  {
    icon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-4.svg",
    placeholder: "Dátum vyzdvihnutia"
  },
  {
    icon: "https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-4.svg",
    placeholder: "Dátum vrátenia"
  }
];

const leftImages = [
  {
    className: "w-36 h-36 top-[392px] left-0 rounded-lg [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok.png)_50%_50%_/_cover]"
  },
  {
    className: "w-[184px] h-[184px] top-44 left-0 [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-1.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-32 h-36 top-0 left-4 object-cover rounded-lg",
    src: "https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-2.png",
    alt: "Obrazok"
  },
  {
    className: "w-[104px] h-[104px] top-80 left-[216px] [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-3.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-36 h-36 top-36 left-[216px] [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-4.png)_50%_50%_/_cover] rounded-lg"
  }
];

const rightImages = [
  {
    className: "w-36 h-36 top-[392px] left-[216px] [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-5.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-[184px] h-[184px] top-44 left-44 [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-6.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-36 h-36 top-0 left-[216px] [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-7.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-[104px] h-[104px] top-28 left-10 [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-8.png)_50%_50%_/_cover] rounded-lg"
  },
  {
    className: "w-36 h-36 top-[248px] left-0 [background:url(https://c.animaapp.com/me95zzp7lVICYW/img/obrazok-9.png)_50%_50%_/_cover] rounded-lg"
  }
];

const vehicleCards = [
  {
    background: "bg-[#141419]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
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
    background: "bg-[#1e1e23]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "image",
    buttonSrc: "https://c.animaapp.com/me95zzp7lVICYW/img/tla--tko.png"
  },
  {
    background: "bg-[#141419]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
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
    background: "bg-[#141419]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
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
    background: "bg-[#141419]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
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
    background: "bg-[#141419]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-5.png",
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
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-3.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-4.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-15.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-1.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-11.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-13.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-12.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-5.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-10.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-14.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-6.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-2.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-9.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-7.svg", className: "" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-8.svg", className: "" }
];

export const FeaturedItemsSection = (): JSX.Element => {
  return (
    <section className="w-full min-h-screen bg-[#05050a] relative overflow-hidden">
      {/* Header */}
      <header className="flex w-full h-[88px] items-center justify-between px-4 md:px-8 py-0 relative z-10">
        <div className="relative w-[150px] md:w-[214.4px] h-6 md:h-8 bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/vector-2.svg)] bg-[100%_100%]" />
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:inline-flex items-center justify-center relative flex-[0_0_auto]">
          <NavigationMenu>
            <NavigationMenuList className="inline-flex items-center justify-center gap-2 relative self-stretch flex-[0_0_auto]">
              {navigationItems.map((item, index) => (
                <NavigationMenuItem key={index} className="inline-flex h-10 items-center justify-center gap-2 p-2 relative flex-[0_0_auto]">
                  <NavigationMenuLink 
                    href={item.href}
                    className="relative w-fit font-medium text-[#bebec3] text-sm leading-6 [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap hover:text-white transition-colors"
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
            <Button variant="ghost" className="inline-flex h-10 items-center justify-center gap-2 px-4 py-3 relative flex-[0_0_auto] rounded-lg hover:bg-transparent">
              <div className="relative w-6 h-6 mt-[-4.00px] mb-[-4.00px]">
                <img
                  className="absolute w-5 h-5 top-0.5 left-0.5"
                  alt="Union"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/union-2.svg"
                />
              </div>
              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#bebec3] text-sm text-right tracking-[0] leading-6 whitespace-nowrap">
                SK
              </div>
            </Button>
            <Button className="inline-flex h-10 items-center justify-center gap-1.5 pl-5 pr-6 py-3 relative flex-[0_0_auto] bg-[#141900] rounded-[99px] hover:bg-[#1a1f00] h-auto">
              <img
                className="mt-[-4.00px] mb-[-4.00px] relative w-6 h-6"
                alt="Icon px"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-11.svg"
              />
              <div className="font-medium text-[#d7ff14] text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                Prihlásiť sa
              </div>
            </Button>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <Button variant="ghost" className="lg:hidden p-2">
          <svg className="w-6 h-6 text-[#bebec3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row w-full items-center justify-between px-4 md:px-8 py-8 lg:py-16 relative z-10 gap-8 lg:gap-0">
        {/* Left Images - Hidden on mobile */}
        <div className="hidden lg:block relative w-[360px] h-[536px] flex-shrink-0">
          {leftImages.map((image, index) => (
            image.src ? (
              <img
                key={index}
                className={`absolute ${image.className}`}
                alt={image.alt}
                src={image.src}
              />
            ) : (
              <div key={index} className={`absolute ${image.className}`} />
            )
          ))}
        </div>

        {/* Center Content */}
        <div className="flex flex-col items-center gap-6 lg:gap-10 flex-1 max-w-4xl mx-0 lg:mx-8">
          <div className="flex flex-col items-center gap-6 lg:gap-10">
            {/* Text instead of image */}
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-[870] text-[#F0FF98] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] leading-tight mb-4">
                Autá pre každodennú potrebu aj nezabudnuteľné zážitky
              </h1>
            </div>
            <p className="max-w-[562px] [font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-sm md:text-base text-center tracking-[0] leading-6 px-4 lg:px-0">
              Spolupracujeme s desiatkami preverených autopožičovní na slovensku
              <br className="hidden md:block" />s ponukou vyše 100+ vozidiel
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 lg:gap-6">
            <Button className="inline-flex items-center gap-2 pl-4 lg:pl-6 pr-1 py-1 bg-[#f0ff98] rounded-[99px] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] hover:bg-[#e8ff80] h-auto text-sm lg:text-base">
              <div className="[font-family:'Poppins',Helvetica] font-semibold text-[#141900] tracking-[0] leading-8 whitespace-nowrap">
                Ponuka vozidiel
              </div>
              <div className="flex w-8 h-8 items-center justify-center bg-[#141900] rounded-[99px] overflow-hidden">
                <img
                  className="w-6 h-6"
                  alt="Icon px"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-6.svg"
                />
              </div>
            </Button>
            <Button variant="secondary" className="inline-flex h-10 items-center gap-2.5 px-4 lg:px-6 py-1 bg-[#28282d] rounded-[99px] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] hover:bg-[#323238] h-auto text-sm lg:text-base">
              <div className="[font-family:'Poppins',Helvetica] font-medium text-[#f0f0f5] tracking-[0] leading-8 whitespace-nowrap">
                Naše služby
              </div>
            </Button>
          </div>
        </div>

        {/* Right Images - Hidden on mobile */}
        <div className="hidden lg:block relative w-[360px] h-[536px] flex-shrink-0">
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
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-8.svg"
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
      <div className="px-4 md:px-8 py-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {vehicleCards.map((card, index) => (
            <Card key={index} className={`${card.background} rounded-2xl lg:rounded-3xl border-0 overflow-hidden group hover:scale-105 transition-transform duration-300`}>
              <CardContent className="p-3 lg:p-4 space-y-4 lg:space-y-6">
                <div 
                  className="relative h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden bg-cover bg-center"
                  style={{ backgroundImage: `url(${card.image})` }}
                >
                  {card.badges.length > 0 && (
                    <div className="flex gap-2 p-2">
                      {card.badges.map((badge, badgeIndex) => (
                        <Badge key={badgeIndex} className={`${badge.className} rounded-full px-2 lg:px-3 py-1 text-xs font-medium`}>
                          {badge.text}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="px-2 lg:px-4 space-y-3 lg:space-y-4">
                  <div className="space-y-1 lg:space-y-2">
                    <h3 className="[font-family:'SF_Pro',Helvetica] font-[650] text-[#f0ff98] text-lg md:text-xl lg:text-2xl tracking-[0] leading-7 overflow-hidden text-ellipsis whitespace-nowrap">
                      {card.title}
                    </h3>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-xs tracking-[0] leading-6">
                      {card.specs}
                    </p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="[font-family:'Poppins',Helvetica] text-sm md:text-base">
                        <span className="font-semibold text-[#a0a0a5] text-xs md:text-sm">{card.pricing.from} </span>
                        {card.pricing.originalPrice && (
                          <span className="font-semibold text-[#646469] text-lg md:text-xl line-through mr-2">
                            {card.pricing.originalPrice}
                          </span>
                        )}
                        <span className={`font-semibold text-xl md:text-2xl ${card.pricing.originalPrice ? 'text-[#d7ff14]' : 'text-[#f0f0f5]'}`}>
                          {card.pricing.price}
                        </span>
                        <span className="text-[#a0a0a5] text-lg md:text-xl">{card.pricing.period}</span>
                      </div>
                    </div>

                    <Button className="w-12 md:w-14 lg:w-16 h-12 md:h-14 lg:h-16 p-0 bg-[#1e1e23] rounded-full hover:bg-[#d7ff14] group-hover:bg-[#d7ff14] transition-colors duration-300">
                      <img
                        className="w-6 md:w-7 lg:w-8 h-6 md:h-7 lg:h-8 group-hover:filter group-hover:brightness-0 transition-all duration-300"
                        alt="Icon px"
                        src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px.svg"
                      />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Centered "Zobraziť všetky vozidlá" button */}
        <div className="flex justify-center mt-8 lg:mt-12">
          <Button className="inline-flex h-12 items-center gap-1.5 px-6 py-2 bg-[#d7ff14] rounded-[99px] hover:bg-[#c9f000] h-auto">
            <span className="font-semibold text-[#141900] text-sm md:text-base [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
              Zobraziť všetky vozidlá
            </span>
            <img
              className="w-5 md:w-6 h-5 md:h-6"
              alt="Icon px"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-9.svg"
            />
          </Button>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="hidden lg:block absolute top-[884px] right-8">
        <div className="relative w-[58px] h-[60px]">
          <div className="relative w-[104px] h-28 -top-3 -left-3.5 bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/union-1.svg)] bg-[100%_100%]">
            <img
              className="absolute w-[54px] h-[54px] top-3 left-3.5"
              alt="Union"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/union.png"
            />
            <div className="absolute w-1.5 h-1.5 top-9 left-7 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
            <div className="absolute w-1.5 h-1.5 top-9 left-[38px] bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
            <div className="absolute w-1.5 h-1.5 top-9 left-12 bg-[#ffffff80] rounded-[3px] shadow-[inset_0px_-2px_2px_#ffffff4c,inset_2px_2px_2px_#d7ff141a]" />
          </div>
        </div>
      </div>
    </section>
  );
};