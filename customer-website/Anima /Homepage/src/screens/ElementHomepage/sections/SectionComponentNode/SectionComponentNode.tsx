import React from "react";
import { Pattern } from "../../../../components/Pattern";
import { PrimaryButtons40PxIcon } from "../../../../components/PrimaryButtons40PxIcon";
import { Icon16Px36 } from "../../../../icons/Icon16Px36";

export const SectionComponentNode = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[360px] h-[792px] items-center gap-11 pt-20 pb-[120px] px-4 absolute top-[4282px] left-0 bg-colors-white-1000 rounded-[24px_24px_0px_0px] overflow-hidden">
      <Pattern
        className="!h-[387px] !absolute bg-[url(/img/group-1.png)] !left-0 !w-[188px] !top-[405px]"
        type="variant-1"
      />
      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative self-stretch h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-[32px] text-center tracking-[0] leading-8 whitespace-nowrap">
              Blackre store
            </div>

            <p className="relative self-stretch h-12 [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-sm text-center tracking-[0] leading-5">
              Vyber si svoj kúsok z našej štýlovej <br />
              kolekcie oblečenia alebo venuj <br />
              darčekový poukaz 😎
            </p>
          </div>
        </div>

        <div className="relative w-[316.96px] h-[350.02px]">
          <div className="absolute w-[104px] h-[104px] top-10 left-[31px] bg-colors-ligh-gray-800 rounded-2xl" />

          <div className="absolute w-[184px] h-[184px] top-[166px] left-0 bg-colors-ligh-gray-800 rounded-2xl" />

          <div className="absolute w-36 h-36 top-0 left-[156px] bg-colors-ligh-gray-800 rounded-2xl" />

          <div className="absolute w-[120px] h-[120px] top-[190px] left-[197px] bg-colors-ligh-gray-800 rounded-2xl" />
        </div>

        <PrimaryButtons40PxIcon
          className=""
          icon={<Icon16Px36 className="!relative !w-4 !h-4" />}
          text="Všetky produkty"
          tlacitkoNaTmavemem40="tlacitko-na-tmavemem-403"
        />
      </div>
    </div>
  );
};
