import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "../../../../components/ui/navigation-menu";

const navigationItems = [
  { label: "Ponuka vozidiel", href: "#" },
  { label: "Služby", href: "#" },
  { label: "Store", href: "#" },
  { label: "O nás", href: "#" },
  { label: "Kontakt", href: "#" }
] as const;

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
] as const;

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
] as const;

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
] as const;

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
    buttonType: "icon" as const
  },
  {
    background: "bg-[#1e1e23]",
    image: "https://c.animaapp.com/me95zzp7lVICYW/img/n-h-ad-vozidla-1.png",
    badges: [],
    title: "Názov vozidla",
    specs: "123 kW ∙ Palivo ∙ Prevodovka ∙ Náhon",
    pricing: {
      from: "od",
      price: "123€",
      period: "/deň"
    },
    buttonType: "image" as const,
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
    buttonType: "icon" as const
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
    buttonType: "icon" as const
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
    buttonType: "icon" as const
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
    buttonType: "icon" as const
  }
] as const;

const brandLogos = [
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-3.svg", className: "mb-[-10932.00px] mr-[-82738.00px]" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-4.svg", className: "mb-[-10932.00px] mr-[-82738.00px]" },
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
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-7.svg", className: "mb-[-10932.00px] mr-[-82738.00px]" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-8.svg", className: "mb-[-10932.00px] mr-[-82738.00px]" }
] as const;

export const FeaturedItemsSection = (): JSX.Element => {
  return (
    <section className="w-full h-[2192px] relative">
<header className="flex w-full h-[88px] items-center justify-between px-8 py-0">
<div className="relative w-[214.4px] h-8 bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/vector-2.svg)] bg-[100%_100%]" />
<nav className="inline-flex items-center justify-center relative flex-[0_0_auto]">
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
</header>
<div className="flex w-full items-center justify-between absolute top-[168px] left-0">
<div className="relative w-[360px] h-[536px]">
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
<div className="inline-flex flex-col h-[536px] items-center gap-10 pt-8 pb-0 px-0 relative flex-[0_0_auto]">
<div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
<img
              className="relative w-[923.23px] h-[114.59px] mt-[-1.91px]"
              alt="Aut pre kadodenn"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/aut--pre-ka-dodenn--potrebu--aj-nezabudnute-n--z--itok.png"
            />
<div className="relative w-[562px] [font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-base text-center tracking-[0] leading-6">
Spolupracujeme s desiatkami preverených autopožičovní na slovensku
              <br />s ponukou vyše 100+ vozidiel
            </div>
</div>
<div className="inline-flex items-start justify-center gap-6 relative flex-[0_0_auto]">
<Button className="inline-flex items-center gap-2 pl-6 pr-1 py-1 relative flex-[0_0_auto] bg-[#f0ff98] rounded-[99px] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] hover:bg-[#e8ff80] h-auto">
<div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-[#141900] text-sm tracking-[0] leading-8 whitespace-nowrap">
Ponuka vozidiel
              </div>
<div className="flex w-8 h-8 items-center justify-center gap-2 px-6 py-3 relative bg-[#141900] rounded-[99px] overflow-hidden">
<img
                  className="mt-[-8.00px] mb-[-8.00px] ml-[-20.00px] mr-[-20.00px] relative w-6 h-6"
                  alt="Icon px"
                  src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-6.svg"
                />
</div>
</Button>
<Button variant="secondary" className="inline-flex h-10 items-center gap-2.5 px-6 py-1 relative flex-[0_0_auto] bg-[#28282d] rounded-[99px] backdrop-blur-[20px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(20px)_brightness(100%)] hover:bg-[#323238] h-auto">
<div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-[#f0f0f5] text-sm tracking-[0] leading-8 whitespace-nowrap">
Naše služby
              </div>
</Button>
</div>
</div>
<div className="relative w-[360px] h-[536px]">
{rightImages.map((image, index) => (
            <div key={index} className={`absolute ${image.className}`} />
))}
        </div>
</div>
<Card className="flex flex-col w-[1102px] h-[232px] items-center justify-end pt-10 pb-6 px-20 absolute top-[704px] left-[329px] rounded-3xl overflow-hidden border border-solid border-[#1e1e23] bg-[linear-gradient(180deg,rgba(30,30,35,1)_0%,rgba(10,10,15,1)_100%),linear-gradient(180deg,rgba(20,20,25,1)_0%,rgba(10,10,15,1)_100%)]">
<CardContent className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto] p-0">
<div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
<h1 className="relative self-stretch h-6 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-[#f0f0f5] text-[32px] tracking-[0] leading-6 whitespace-nowrap">
Požičajte si auto už dnes
            </h1>
<div className="flex h-4 items-center gap-1 relative self-stretch w-full">
<div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-sm tracking-[0] leading-6 whitespace-nowrap">
✅ Rýchlo, jednoducho a bez skyrytých poplatkov
              </div>
</div>
</div>
<div className="flex items-center gap-4 p-4 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-2xl">
<div className="flex items-center justify-center gap-4 relative flex-1 grow">
{searchFields.map((field, index) => (
                <div key={index} className="flex h-14 items-center gap-2 px-4 py-2 relative flex-1 grow bg-[#1e1e23] rounded-lg">
<img
                    className="relative w-6 h-6"
                    alt="Icon px"
                    src={field.icon}
                  />
<div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-[#bebec3] text-sm tracking-[0] leading-6">
{field.placeholder}
                  </div>
</div>
))}
            </div>
<Button className="relative flex-[0_0_auto] inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 bg-[#d7ff14] rounded-[99px] hover:bg-[#c9f000] h-auto">
<div className="font-semibold text-[#141900] text-sm relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
Vyhľadať
              </div>
<img
                className="relative w-6 h-6"
                alt="Icon px"
                src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-8.svg"
              />
</Button>
</div>
</CardContent>
</Card>
<div className="flex w-full h-[104px] items-center gap-2 absolute top-[1056px] left-4">
<div className="flex w-full h-[100px] items-center justify-center gap-12 relative">
{brandLogos.map((logo, index) => (
            <img
              key={index}
              className={`relative w-[100px] h-[100px] ${logo.className}`}
              alt="Loga aut"
              src={logo.src}
            />
))}
        </div>
<div className="left-[1560px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(5,5,10,1)_100%)] absolute w-[168px] h-[100px] top-0.5" />
<div className="left-0 bg-[linear-gradient(90deg,rgba(5,5,10,1)_0%,rgba(0,0,0,0)_100%)] absolute w-[168px] h-[100px] top-0.5" />
</div>
<div className="flex flex-wrap w-full items-start justify-center gap-[64px_31px] absolute top-[1280px] left-4">
{vehicleCards.map((card, index) => (
          <Card key={index} className={`${card.background} flex flex-col w-[422px] h-[424px] items-start justify-around gap-3.5 p-4 relative rounded-3xl overflow-hidden border-0`}>
<CardContent className="flex flex-col items-start gap-6 relative flex-1 self-stretch w-full grow p-0">
<div 
  className={`relative self-stretch w-full h-64 rounded-lg ${card.badges.length > 0 ? 'flex items-start gap-2 p-2 overflow-hidden' : ''} bg-cover bg-center`}
  style={{ backgroundImage: `url(${card.image})` }}
>
{card.badges.map((badge, badgeIndex) => (
                  <Badge key={badgeIndex} className={`inline-flex flex-wrap h-6 items-start gap-[4px_4px] px-3 py-2 relative flex-[0_0_auto] rounded-[99px] ${badge.className} hover:${badge.className}`}>
<div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-xs tracking-[0] leading-6 whitespace-nowrap">
{badge.text}
                    </div>
</Badge>
))}
              </div>
<div className="flex flex-col items-start justify-between pl-4 pr-0 py-0 relative flex-1 self-stretch w-full grow">
<div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
<h3 className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-[#f0ff98] text-2xl tracking-[0] leading-7 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:0] [-webkit-box-orient:vertical]">
{card.title}
                  </h3>
<div className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-xs tracking-[0] leading-6">
{card.specs}
                  </div>
</div>
<div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
<div className="flex h-16 items-end justify-center gap-2 pl-0 pr-2 pt-0 pb-4 relative flex-1 grow">
<div className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-transparent text-base tracking-[0] leading-6">
<span className="font-semibold text-[#a0a0a5]">{card.pricing.from}</span>
{card.pricing.originalPrice && (
                        <>
<span className="font-semibold text-[#646469] text-2xl line-through">
{card.pricing.originalPrice}
                          </span>
<span className="font-semibold text-[#a0a0a5] text-2xl">
&nbsp;
                          </span>
</>
)}
                      {!card.pricing.originalPrice && (
                        <span className="font-semibold text-[#a0a0a5] text-xl">
&nbsp;
                        </span>
)}
                      <span className={`font-semibold text-2xl ${card.pricing.originalPrice ? 'text-[#d7ff14]' : 'text-[#f0f0f5]'}`}>
{card.pricing.price}
                      </span>
<span className="text-[#a0a0a5] text-2xl">{card.pricing.period}</span>
</div>
</div>
{card.buttonType === "icon" ? (
                    <Button className="flex w-16 h-16 items-center justify-center gap-2 px-6 py-3 relative bg-[#1e1e23] rounded-[999px] overflow-hidden hover:bg-[#2a2a2f] h-auto">
<img
                        className="ml-[-8.00px] mr-[-8.00px] relative w-8 h-8"
                        alt="Icon px"
                        src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-32-px.svg"
                      />
</Button>
) : (
                    <img
                      className="relative w-16 h-16"
                      alt="Tlatko"
                      src={card.buttonSrc}
                    />
)}
                </div>
</div>
</CardContent>
</Card>
))}
      </div>
<div className="inline-flex items-center gap-2 p-8 absolute top-[884px] left-[1622px]">
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
      </div>
    </section>
  );
};
