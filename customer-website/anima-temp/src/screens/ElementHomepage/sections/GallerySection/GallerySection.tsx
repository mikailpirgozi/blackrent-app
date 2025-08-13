import { ArrowRightIcon } from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";

export const GallerySection = (): JSX.Element => {
  const productPlaceholders = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 },
  ];

  return (
    <section className="relative w-full bg-[#fafaff] rounded-[40px_40px_0px_0px] overflow-hidden">
      <div className="absolute w-[476px] h-[982px] top-[586px] left-0 bg-[url(https://c.animaapp.com/me95zzp7lVICYW/img/vector-3.svg)] bg-[100%_100%]" />

      <div className="flex flex-col w-[1084px] items-center gap-12 absolute top-[200px] left-[322px]">
        <h2 className="w-[439px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-[#1e1e23] text-5xl text-center tracking-[0] leading-[48px] whitespace-nowrap relative h-8">
          Blackrent store
        </h2>

        <p className="relative w-[650px] h-12 [font-family:'Poppins',Helvetica] font-normal text-[#646469] text-2xl text-center tracking-[0] leading-8">
          Vyber si svoj kúsok z našej štýlovej&nbsp;&nbsp;kolekcie oblečenia{" "}
          <br />
          alebo venuj darčekový poukaz 😎
        </p>
      </div>

      <div className="absolute top-[448px] left-[540px] grid grid-cols-3 gap-4 w-[648px]">
        {productPlaceholders.map((item) => (
          <div
            key={item.id}
            className="w-[200px] h-[200px] bg-gray-200 rounded-lg"
          />
        ))}
      </div>

      <Button className="absolute top-[1320px] left-[760px] h-12 gap-1.5 pl-6 pr-5 py-2 bg-[#d7ff14] hover:bg-[#c7ef04] rounded-[99px] text-[#141900] [font-family:'Poppins',Helvetica] font-semibold text-base">
        Všetky produkty
        <ArrowRightIcon className="w-6 h-6" />
      </Button>

      <img
        className="absolute w-[648px] h-[688px] top-[448px] left-[540px]"
        alt="Group"
        src="https://c.animaapp.com/me95zzp7lVICYW/img/group-996.png"
      />
    </section>
  );
};
