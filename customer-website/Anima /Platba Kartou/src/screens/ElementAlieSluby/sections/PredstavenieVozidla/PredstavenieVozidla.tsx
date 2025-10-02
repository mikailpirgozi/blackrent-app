import React from "react";

export const PredstavenieVozidla = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-start gap-8 px-4 py-0 absolute top-[229px] left-4">
      <div className="inline-flex h-4 items-center justify-center gap-2 relative">
        <div className="relative w-fit [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
          Poistenie
        </div>
      </div>

      <div className="relative self-stretch w-full h-11 mr-[-2.00px]">
        <p className="absolute w-[296px] top-0 left-0 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-[18px]">
          Všetky naše vozidlá sú automaticky poistené. Poskytujeme však možnosť
          pripoistenia ktoré základné poistenie nepokrýva.
        </p>
      </div>
    </div>
  );
};
