import React from "react";
import { ElementIconsDarkMedium } from "../../../../components/ElementIconsDarkMedium";

export const FrameWrapper = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-center gap-16 absolute top-[104px] left-4">
      <ElementIconsDarkMedium
        ellipse="/img/ellipse-1-2.svg"
        overlapGroupClassName="bg-[url(/img/union-6.svg)]"
        type="check"
        union="/img/union-7.svg"
      />
      <div className="inline-flex flex-col items-center gap-8 relative flex-[0_0_auto]">
        <div className="relative w-[311px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl text-center tracking-[0] leading-7 whitespace-nowrap">
          Ďakujeme za objednávku!
        </div>

        <div className="flex flex-col w-[328px] items-center gap-2 relative flex-[0_0_auto]">
          <p className="relative w-[283px] h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm text-center tracking-[0] leading-6 whitespace-nowrap">
            Vašu objednávku 242031667 sme prijali.
          </p>

          <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-center tracking-[0] leading-4">
            Na e-mail Vám bude zaslané potvrdenie <br />a súhrn objednávky.
          </p>
        </div>
      </div>
    </div>
  );
};
