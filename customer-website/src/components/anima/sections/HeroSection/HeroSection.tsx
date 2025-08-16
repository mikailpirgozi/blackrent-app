import React from "react";
import { Button } from "../../../ui/Button";
import { Card, CardContent } from "../../../ui/card";

export const HeroSection = (): JSX.Element => {
  const paginationDots = [
    { active: true },
    { active: false },
    { active: false },
  ];

  return (
    <Card className="w-full max-w-[1328px] mx-auto bg-[#fafaff] rounded-3xl overflow-hidden">
      <CardContent className="flex items-center justify-between p-0 min-h-[424px]">
        <div className="flex flex-col w-full max-w-[454px] items-start justify-center gap-12 pl-[113px] py-12">
          <div className="flex flex-col items-start gap-10 w-full">
            <div className="[font-family:'Poppins',Helvetica] font-medium text-[#3c3c41] text-xl tracking-[0] leading-6 whitespace-nowrap">
              🔥 Obľúbené u nás
            </div>

            <div className="flex flex-col items-start gap-6 w-full">
              <h1 className="[font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-[#1e1e23] text-[40px] tracking-[0] leading-6 whitespace-nowrap">
                TESLA Model S
              </h1>

              <p className="[font-family:'Poppins',Helvetica] font-normal text-[#646469] text-base tracking-[0] leading-6 max-w-[461px]">
                Ako jedna z mála autopožičovní na slovensku máme v ponuke 2
                Tesly Model S. Tesly sú dostupné k prenájmu už od jedného dňa.
                Či už ste priaznovcom elektromobility alebo nie, vyskúšajte si
                jazdu v najznámejšom elektromobile sveta.
              </p>
            </div>
          </div>

          <Button className="inline-flex h-12 items-center gap-1.5 px-6 py-2 bg-[#d7ff14] hover:bg-[#c5e612] rounded-[99px] h-auto">
            <span className="font-semibold text-[#283002] text-base [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
              Detail ponuky
            </span>
            <img
              className="w-6 h-6"
              alt="Icon px"
              src="/assets/misc/icon-24-px-9.svg"
            />
          </Button>
        </div>

        <div className="flex-1 self-stretch min-h-[424px] rounded-[32px] bg-blend-multiply bg-[url(/assets/misc/frame-968.png)] bg-cover bg-[50%_50%] relative">
          <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2">
            {paginationDots.map((dot, index) => (
              <div
                key={index}
                className={`rounded-full ${
                  dot.active ? "w-3 h-3 bg-[#a0a0a5]" : "w-2 h-2 bg-[#bebec3]"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
