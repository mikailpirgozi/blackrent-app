import React from "react";

export const Frame = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-start gap-6 px-4 py-8 absolute top-[1386px] left-4 bg-colors-black-300 rounded-2xl">
      <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
        Cenové relácie
      </div>

      <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex h-12 items-center justify-between px-0 py-2 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 px-2 py-0 relative">
            <div className="relative flex-1 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[18px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
              Počet dní prenájmu
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 px-2 py-0 relative">
            <div className="flex-1 text-xs text-right leading-[18px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0]">
              Nájazd <br />
              km/deň
            </div>
          </div>

          <div className="flex items-center gap-2 px-2 py-0 relative flex-1 grow">
            <div className="flex-1 text-xs text-right leading-[18px] overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] relative mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0]">
              Cena <br />
              prenájmu/deň
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              0–1 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              300 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              200 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              2–3 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              250 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-[35px] mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              175 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              4–7 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              210 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              150 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              8–14 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              170 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              130 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              15–22 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              150 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              120 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-xs tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              23–30 dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              130 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              110 €
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-between px-0 py-5 relative self-stretch w-full border-b [border-bottom-style:solid] border-colors-black-800">
          <div className="flex w-[88px] items-center gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] mr-[-1.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              31 a viac dní
            </div>
          </div>

          <div className="flex w-[88px] items-center justify-end gap-2 p-2 relative self-stretch">
            <div className="w-fit mt-[-9.00px] mb-[-7.00px] text-colors-white-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6">
              115 km
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-2 relative flex-1 self-stretch grow">
            <div className="relative w-fit mt-[-9.00px] mb-[-7.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              100 €
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
