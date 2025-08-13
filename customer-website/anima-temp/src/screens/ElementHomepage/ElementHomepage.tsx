import React from "react";
import { ContactSection } from "./sections/ContactSection/ContactSection";
import { FeaturedItemsSection } from "./sections/FeaturedItemsSection";
import { GallerySection } from "./sections/GallerySection/GallerySection";
import { HeroSection } from "./sections/HeroSection";
import { ReviewsSection } from "./sections/ReviewsSection/ReviewsSection";

export const ElementHomepage = (): JSX.Element => {
  const galleryImages = [
    {
      className: "absolute w-[200px] h-[250px] top-0 left-0",
      src: "https://c.animaapp.com/me95zzp7lVICYW/img/group.png",
      alt: "Group",
    },
    {
      className: "absolute w-[200px] h-[250px] top-20 left-[280px]",
      src: "https://c.animaapp.com/me95zzp7lVICYW/img/group-1.png",
      alt: "Group",
    },
    {
      className: "absolute w-[200px] h-[250px] top-[330px] left-0",
      src: "https://c.animaapp.com/me95zzp7lVICYW/img/group-2.png",
      alt: "Group",
    },
    {
      className: "absolute w-[200px] h-[250px] top-[410px] left-[280px]",
      src: "https://c.animaapp.com/me95zzp7lVICYW/img/group-3.png",
      alt: "Group",
    },
  ];

  const noteCards = [
    {
      className:
        "flex flex-col w-[298px] items-start gap-4 p-4 absolute top-[1187px] left-[54px] bg-[#faffdc] rounded-lg border-2 border-solid border-[#d7ff14]",
      content: (
        <>
          <a
            className="relative w-fit mt-[-2.00px] [font-family:'Inter',Helvetica] font-normal text-[#1e1e23] text-xs tracking-[0] leading-[normal] underline whitespace-nowrap"
            href="https://turo.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://turo.com/
          </a>
          <div className="relative self-stretch [font-family:'Inter',Helvetica] font-normal text-[#1e1e23] text-xs tracking-[0] leading-[normal]">
            Časté otázky zobrazenie podľa webu Turo
          </div>
        </>
      ),
    },
    {
      className:
        "top-[1187px] left-[390px] bg-[#ff505a] flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid",
      content: (
        <div className="relative self-stretch mt-[-2.00px] [font-family:'Inter',Helvetica] font-bold text-[#fafaff] text-xs tracking-[0] leading-[normal]">
          Poznámka z 2. 8. 2024
          <br />
          <br />
          23. 8. 2024 – Nieje opravené
        </div>
      ),
    },
    {
      className:
        "top-[2225px] left-[1396px] bg-[#ff505a] flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid",
      content: (
        <div className="relative self-stretch mt-[-2.00px] [font-family:'Inter',Helvetica] font-bold text-[#fafaff] text-xs tracking-[0] leading-[normal]">
          Pattern v pätičke (call) z 2. 8. 2024
          <br />
          <br />
          23. 8. 2024 – Nieje opravené
        </div>
      ),
    },
    {
      className:
        "top-10 left-[35px] bg-[#faffdc] border-[#d7ff14] flex flex-col w-[298px] items-start gap-4 p-4 absolute rounded-lg border-2 border-solid",
      content: (
        <>
          <a
            className="relative w-fit mt-[-2.00px] [font-family:'Inter',Helvetica] font-normal text-black text-xs tracking-[0] leading-[normal] underline whitespace-nowrap"
            href="https://www.visitestonia.com/en"
            rel="noopener noreferrer"
            target="_blank"
          >
            https://www.visitestonia.com/en
          </a>
          <div className="relative self-stretch [font-family:'Inter',Helvetica] font-normal text-[#1e1e23] text-xs tracking-[0] leading-[normal]">
            Posuvník Referencie
          </div>
        </>
      ),
    },
  ];

  return (
    <div
      className="w-full flex flex-col bg-[#05050a]"
      data-model-id="10392:19171"
    >
      <div className="relative w-full">
        <div className="absolute w-[800px] h-[800px] top-0 left-1/2 transform -translate-x-1/2 bg-[#1e1e23] rounded-[400px] blur-[250px]" />
        <FeaturedItemsSection />
      </div>

      <section className="relative w-full">
        <div className="absolute w-[480px] h-[660px] top-0 left-0">
          {galleryImages.map((image, index) => (
            <img
              key={`gallery-image-${index}`}
              className={image.className}
              alt={image.alt}
              src={image.src}
            />
          ))}
        </div>

        <HeroSection />

        <div className="absolute top-0 right-0 inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 bg-[#d7ff14] rounded-[99px]">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-[#141900] text-base tracking-[0] leading-6 whitespace-nowrap">
            Všetky vozidlá
          </div>
          <img
            className="relative w-6 h-6"
            alt="Icon px"
            src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-9.svg"
          />
        </div>
      </section>

      <GallerySection />

      <section className="relative w-full">
        <ReviewsSection />
        <ContactSection />

        {noteCards.map((card, index) => (
          <div key={`note-card-${index}`} className={card.className}>
            {card.content}
          </div>
        ))}
      </section>
    </div>
  );
};
