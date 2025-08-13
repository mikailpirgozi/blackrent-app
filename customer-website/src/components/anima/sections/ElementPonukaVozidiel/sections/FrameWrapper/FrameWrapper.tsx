import React from "react";
import { IconPxFilled } from "../../../../components/IconPxFilled";

export const FrameWrapper = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-center gap-6 absolute top-[88px] left-4">
      <p className="relative w-[328px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-xl text-center tracking-[0] leading-6">
        Vyberte si z ponuky vyše 1000+ vozidiel
      </p>

      <div className="inline-flex flex-col items-center gap-2 relative flex-[0_0_auto]">
        <div className="relative w-[183px] h-2 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm text-center tracking-[0] leading-[64px] whitespace-nowrap">
          4,85 hodnotení na Google
        </div>

        <div className="inline-flex items-start relative flex-[0_0_auto]">
          <IconPxFilled
            className="!relative !left-[unset] !top-[unset]"
            type="star-small"
            typeStarSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-91.svg"
          />
          <IconPxFilled
            className="!relative !left-[unset] !top-[unset]"
            type="star-small"
            typeStarSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-91.svg"
          />
          <IconPxFilled
            className="!relative !left-[unset] !top-[unset]"
            type="star-small"
            typeStarSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-91.svg"
          />
          <IconPxFilled
            className="!relative !left-[unset] !top-[unset]"
            type="star-small"
            typeStarSmall="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-91.svg"
          />
          <IconPxFilled
            className="!relative !left-[unset] !top-[unset]"
            type="star-small-half"
            typeStarSmallHalf="https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-92.svg"
          />
        </div>
      </div>
    </div>
  );
};
