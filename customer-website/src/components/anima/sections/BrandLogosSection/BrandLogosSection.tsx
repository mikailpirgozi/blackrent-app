import React from "react";

const brandLogos = [
  { src: "/assets/logos/audi-logo.svg", alt: "Audi" },
  { src: "/assets/logos/bmw-logo.svg", alt: "BMW" },
  { src: "/assets/logos/chevrolet-logo.svg", alt: "Chevrolet" },
  { src: "/assets/logos/dodge-logo.svg", alt: "Dodge" },
  { src: "/assets/logos/ford-logo.svg", alt: "Ford" },
  { src: "/assets/logos/hyundai-logo.svg", alt: "Hyundai" },
  { src: "/assets/logos/iveco-logo.svg", alt: "Iveco" },
  { src: "/assets/logos/jaguar-logo.svg", alt: "Jaguar" },
  { src: "/assets/logos/mercedes-logo.svg", alt: "Mercedes" },
  { src: "/assets/logos/mustang-logo.svg", alt: "Mustang" },
  { src: "/assets/logos/nissan-logo.svg", alt: "Nissan" },
  { src: "/assets/logos/opel-logo.svg", alt: "Opel" },
  { src: "/assets/logos/porsche-logo.svg", alt: "Porsche" },
  { src: "/assets/logos/skoda-logo.svg", alt: "Skoda" },
  { src: "/assets/logos/tesla-logo.svg", alt: "Tesla" },
  { src: "/assets/logos/volkswagen-logo.svg", alt: "Volkswagen" }
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
