import React from "react";
import { RecenzieMobile } from "../../../../components/RecenzieMobile";

export const Frame1 = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[360px] items-start gap-[23px] pt-20 pb-48 px-4 absolute top-0 left-0 bg-colors-white-800 overflow-hidden">
      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col w-[308px] items-center gap-10 relative flex-[0_0_auto]">
          <div className="relative self-stretch h-[88px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-[32px] text-center tracking-[0] leading-8">
            Skúsenosti našich <br />
            zákazníkov
          </div>

          <p className="relative self-stretch h-12 [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-sm text-center tracking-[0] leading-5">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore
          </p>
        </div>

        <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative self-stretch w-full h-24">
            <div className="absolute w-[202px] h-[72px] top-6 left-[126px] shadow-[0px_4px_16px_#e6e6ea]">
              <div className="relative w-[195px] h-[65px] left-[7px] bg-[url(/img/rectangle-962-4.svg)] bg-[100%_100%]">
                <div className="absolute h-7 top-[13px] left-[33px] rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-yellow-accent-200 text-sm tracking-[0] leading-[18px]">
                  Tisíce spokojných
                  <br />
                  zákazníkov ročne!
                </div>

                <div className="absolute h-3.5 top-[30px] left-[163px] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
                  🤝
                </div>
              </div>
            </div>

            <div className="absolute w-[66px] h-[61px] top-0 left-[60px] shadow-[0px_4px_16px_#e6e6ea]">
              <div className="relative w-[62px] h-14 top-px left-px bg-[url(/img/rectangle-962-5.svg)] bg-[100%_100%]">
                <div className="absolute h-[13px] top-[19px] left-[11px] rotate-[4.00deg] font-normal text-black text-lg leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
                  🔥🤓
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <RecenzieMobile
        className="!mr-[-1248.00px] !flex-[0_0_auto]"
        kartaRecenzieMobilDivClassName="!mt-[-6501px]"
        kartaRecenzieMobilDivClassNameOverride="!mt-[-6501px]"
        kartaRecenzieMobilFrameClassName="!mt-[-6501px]"
        kartaRecenzieMobilFrameClassNameOverride="!mt-[-6501px]"
      />
      <div className="absolute w-16 h-16 top-[808px] left-8 shadow-[0px_4px_16px_#e6e6ea]">
        <div className="relative w-[54px] h-[58px] top-[5px] left-px bg-[url(/img/rectangle-962-19.svg)] bg-[100%_100%]">
          <div className="absolute h-3.5 top-[25px] left-[17px] rotate-[-8.00deg] font-normal text-black text-xl leading-[18px] [font-family:'Poppins',Helvetica] tracking-[0] whitespace-nowrap">
            😍
          </div>
        </div>
      </div>
    </div>
  );
};
