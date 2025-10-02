import React from "react";
import { IconColor } from "../../../../components/IconColor";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-center gap-6 px-4 py-8 absolute top-[361px] left-4 bg-colors-black-300 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
          Základné
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
        alt="Line"
        src="/img/line-10-2.svg"
      />

      <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <IconColor className="!flex-[0_0_auto]" type="warring" />
          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm text-center tracking-[0] leading-[22px]">
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              V případě poškození auta je pojištění karoserie v omezeném
              rozsahu. Zaplatíte až{" "}
            </span>

            <span className="font-semibold">10%</span>

            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              {" "}
              z ceny vozu (spoluúčast).
            </span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <IconColor className="!flex-[0_0_auto]" type="warring" />
          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm text-center tracking-[0] leading-[22px]">
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              V případě odcizení auta platí omezené krytí. Zaplatíte až{" "}
            </span>

            <span className="font-semibold">10%</span>

            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              {" "}
              z ceny vozu (spoluúčast).
            </span>
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <IconColor className="!flex-[0_0_auto]" type="warring" />
          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm text-center tracking-[0] leading-[22px]">
            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              Odtah, ztráta klíčů, a administrativní poplatky{" "}
            </span>

            <span className="font-semibold">nejsou součástí pojištění. </span>

            <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-[22px]">
              Zaplatíte v plné výši.
            </span>
          </p>
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
        alt="Line"
        src="/img/line-10-2.svg"
      />

      <div className="flex items-start justify-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-400 text-sm text-center tracking-[0] leading-5">
          Už zahrnuté <br />v cene
        </div>
      </div>
    </div>
  );
};
