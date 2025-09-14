import React from "react";
import { Icon24PxFilled91 } from "../../../../icons/Icon24PxFilled91";
import { Icon24PxFilled92 } from "../../../../icons/Icon24PxFilled92";

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
          <Icon24PxFilled91 className="!relative !w-4 !h-4" />
          <Icon24PxFilled91 className="!relative !w-4 !h-4" />
          <Icon24PxFilled91 className="!relative !w-4 !h-4" />
          <Icon24PxFilled91 className="!relative !w-4 !h-4" />
          <Icon24PxFilled92 className="!relative !w-4 !h-4" />
        </div>
      </div>
    </div>
  );
};
