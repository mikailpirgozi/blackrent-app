import React from "react";
import { IconColor } from "../../../../components/IconColor";
import { SecondaryButtons } from "../../../../components/SecondaryButtons";
import { IconsEmoji2 } from "../../../../icons/IconsEmoji2";

export const FrameWrapper = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] items-center absolute top-[959px] left-4 bg-[#6e5af0] rounded-2xl overflow-hidden">
      <div className="inline-flex items-center justify-center gap-0.5 px-0 py-4 relative flex-[0_0_auto]">
        <div className="inline-flex items-center justify-center gap-0.5 relative flex-[0_0_auto]">
          <IconsEmoji2
            className="!relative !w-6 !h-6"
            color="url(#pattern0_10955_23878)"
          />
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
            Najobľúbenejšie
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 px-4 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-300 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-center gap-2 px-2 py-0 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6 whitespace-nowrap">
            Štandardné
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Line"
          src="/img/line-10-2.svg"
        />

        <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <IconColor className="!flex-[0_0_auto]" type="check-lime" />
            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm text-center tracking-[0] leading-[22px]">
              <span className="text-[#f0f0f5]">
                V případě poškození auta je pojištění karoserie v omezeném
                rozsahu. Zaplatíte až
              </span>

              <span className="font-semibold text-[#f0f0f5]"> 5%</span>

              <span className="text-[#f0f0f5]"> z ceny vozu (spoluúčast).</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <IconColor className="!flex-[0_0_auto]" type="check-lime" />
            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm text-center tracking-[0] leading-[22px]">
              <span className="text-[#f0f0f5]">
                V případě odcizení auta platí omezené krytí. Zaplatíte až{" "}
              </span>

              <span className="font-semibold text-[#f0f0f5]">5%</span>

              <span className="text-[#f0f0f5]"> z ceny vozu (spoluúčast).</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <IconColor className="!flex-[0_0_auto]" type="check-lime" />
            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm text-center tracking-[0] leading-[22px]">
              <span className="text-[#f0f0f5]">
                Odtah, ztráta klíčů, a administrativní poplatky{" "}
              </span>

              <span className="font-semibold text-[#f0f0f5]">
                nejsou součástí pojištění.{" "}
              </span>

              <span className="text-[#f0f0f5]">
                Zaplatíte v plné výši.
                <br />
              </span>
            </p>
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Line"
          src="/img/line-10-2.svg"
        />

        <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
          <p className="relative w-[178px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-light-yellow-accent-100 text-sm text-center tracking-[0] leading-6">
            <span className="text-[#a0a0a5]">
              Cena auta +<br />
            </span>

            <span className="font-bold text-[#f0f0f5] text-base">123 €</span>
          </p>
        </div>

        <SecondaryButtons
          className="!self-stretch !flex !w-full"
          secondaryBig="secondary"
          text="Pridať poistenie"
        />
      </div>
    </div>
  );
};
