import React from "react";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] h-[328px] items-center gap-[35px] pt-10 pb-0 px-0 absolute top-[248px] left-4 bg-colors-white-1000 rounded-3xl overflow-hidden">
      <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <p className="relative self-stretch h-12 mt-[-1.00px] [font-family:'SF_Pro-ExpandedRegular',Helvetica] font-normal text-colors-black-800 text-2xl text-center tracking-[0] leading-7">
          Nové modely Tesla <br />
          aktuálne v ponuke
        </p>

        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs text-center tracking-[0] leading-5">
          Lorem ipsum text Lorem ipsum text 🔋
        </p>
      </div>

      <div className="inline-flex items-center justify-center gap-2 absolute top-[300px] left-[138px]">
        <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-200 rounded-[99px]" />
      </div>

      <div className="absolute w-[480px] h-[88px] top-[168px] -left-4">
        <div className="relative h-[88px]">
          <div className="absolute w-[264px] h-[88px] top-0 left-0 rounded-[40px] bg-[url(/img/obrazok.png)] bg-cover bg-[50%_50%]" />

          <div className="w-[264px] left-[88px] bg-[url(/img/obrazok-1.png)] absolute h-[88px] top-0 rounded-[40px] bg-cover bg-[50%_50%]" />

          <div className="w-[277px] left-[203px] bg-[url(/img/obrazok-2.png)] absolute h-[88px] top-0 rounded-[40px] bg-cover bg-[50%_50%]" />
        </div>
      </div>
    </div>
  );
};
