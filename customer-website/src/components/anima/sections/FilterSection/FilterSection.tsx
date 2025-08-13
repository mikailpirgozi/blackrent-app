import React from "react";
import { Button } from "../../../ui/button";
import { Card, CardContent } from "../../../ui/card";

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

export const FilterSection = (): JSX.Element => {
  return (
    <Card className="flex flex-col w-[1102px] h-[232px] items-center justify-end pt-10 pb-6 px-20 mx-auto rounded-3xl overflow-hidden border border-solid border-[#1e1e23] bg-[linear-gradient(180deg,rgba(30,30,35,1)_0%,rgba(10,10,15,1)_100%),linear-gradient(180deg,rgba(20,20,25,1)_0%,rgba(10,10,15,1)_100%)]">
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
              alt="Search icon"
              src="https://c.animaapp.com/me95zzp7lVICYW/img/icon-24-px-8.svg"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
