import React from "react";

const brandLogos = [
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-3.svg", alt: "Audi" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-4.svg", alt: "BMW" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-15.svg", alt: "Chevrolet" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut.svg", alt: "Dodge" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-1.svg", alt: "Ford" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-11.svg", alt: "Hyundai" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-13.svg", alt: "Iveco" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-12.svg", alt: "Jaguar" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-5.svg", alt: "Mercedes" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-10.svg", alt: "Mustang" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-14.svg", alt: "Nissan" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-6.svg", alt: "Opel" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-2.svg", alt: "Porsche" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-9.svg", alt: "Skoda" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-7.svg", alt: "Tesla" },
  { src: "https://c.animaapp.com/me95zzp7lVICYW/img/loga-aut-8.svg", alt: "Volkswagen" }
] as const;

export const BrandLogosSection = (): JSX.Element => {
  return (
    <div className="flex w-full h-[104px] items-center gap-2 relative overflow-hidden">
      <div className="flex w-full h-[100px] items-center justify-center gap-12 relative">
        <div className="flex items-center gap-12 animate-scroll">
          {/* First set of logos */}
          {brandLogos.map((logo, index) => (
            <img
              key={`first-${index}`}
              className="relative w-[100px] h-[100px] flex-shrink-0"
              alt={logo.alt}
              src={logo.src}
            />
          ))}
          {/* Duplicate set for seamless loop */}
          {brandLogos.map((logo, index) => (
            <img
              key={`second-${index}`}
              className="relative w-[100px] h-[100px] flex-shrink-0"
              alt={logo.alt}
              src={logo.src}
            />
          ))}
        </div>
      </div>
      
      {/* Gradient overlays */}
      <div className="absolute left-0 top-0.5 w-[168px] h-[100px] bg-[linear-gradient(90deg,rgba(5,5,10,1)_0%,rgba(0,0,0,0)_100%)] pointer-events-none" />
      <div className="absolute right-0 top-0.5 w-[168px] h-[100px] bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(5,5,10,1)_100%)] pointer-events-none" />
    </div>
  );
};
