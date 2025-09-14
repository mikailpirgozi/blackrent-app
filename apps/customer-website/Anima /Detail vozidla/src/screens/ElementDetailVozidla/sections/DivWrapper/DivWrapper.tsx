import React from "react";
import { Frame263 } from "../../../../components/Frame263";
import { Icon16Px64 } from "../../../../icons/Icon16Px64";
import { Icon16Px75 } from "../../../../icons/Icon16Px75";
import { TypShare } from "../../../../icons/TypShare";

export const DivWrapper = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-start gap-2 absolute top-[88px] left-4">
      <div className="flex flex-col w-[328px] items-start gap-4 relative flex-[0_0_auto]">
        <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl tracking-[0] leading-[30px] whitespace-nowrap">
          BMW 440i
        </div>

        <Frame263
          className="!flex-[0_0_auto]"
          divClassName="!text-colors-ligh-gray-800 !text-[10px]"
          divClassNameOverride="!text-colors-ligh-gray-800 !text-[10px]"
          icon16Px100Color="#BEBEC3"
          icon16Px101Color="#BEBEC3"
          icon16Px4Color="#BEBEC3"
          icon16Px5Color="#BEBEC3"
          popisClassName="!text-colors-ligh-gray-800 !text-[10px]"
          popisClassNameOverride="!text-colors-ligh-gray-800 !text-[10px]"
        />
      </div>

      <img
        className="w-[329px] relative h-px ml-[-0.50px] mr-[-0.50px]"
        alt="Line"
        src="/img/line-11.svg"
      />

      <div className="flex w-[328px] items-center justify-between relative flex-[0_0_auto]">
        <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
          <img
            className="relative w-[107.2px] h-4"
            alt="Vector"
            src="/img/vector-32.svg"
          />

          <Icon16Px64 className="!relative !w-4 !h-4" color="#BEBEC3" />
        </div>

        <div className="inline-flex items-start gap-1 relative flex-[0_0_auto]">
          <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
            <TypShare className="!relative !w-4 !h-4" color="#BEBEC3" />
          </div>

          <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
            <Icon16Px75 className="!relative !w-4 !h-4" color="#BEBEC3" />
          </div>
        </div>
      </div>
    </div>
  );
};
