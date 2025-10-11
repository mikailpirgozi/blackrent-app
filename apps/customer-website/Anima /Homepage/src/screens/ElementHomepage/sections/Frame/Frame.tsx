import React from "react";
import { LandingPageButton } from "../../../../components/LandingPageButton";
import { Icon16Px40 } from "../../../../icons/Icon16Px40";

export const Frame = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-center gap-6 absolute top-[104px] left-4">
      <div className="flex flex-col w-[328px] items-center gap-4 relative flex-[0_0_auto]">
        <p className="relative self-stretch h-16 mt-[-1.00px] [font-family:'SF_Pro-ExpandedMedium',Helvetica] font-medium text-colors-light-yellow-accent-700 text-lg text-center tracking-[0] leading-6">
          Autá pre každodennú
          <br />
          potrebu, aj nezabudnuteľný zážitok
        </p>

        <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-xs text-center tracking-[0] leading-4">
          Desiatky preverených autopožičovní <br />s ponukou vyše 1000+ vozidiel
        </p>
      </div>

      <LandingPageButton
        icon={<Icon16Px40 className="!relative !w-4 !h-4" />}
        property1="default"
      />
    </div>
  );
};
