import React from "react";
import { TlacitkoNaTmavememWrapper } from "../../../../components/TlacitkoNaTmavememWrapper";

export const Div = (): JSX.Element => {
  return (
    <div className="flex flex-col w-[328px] h-[560px] items-start gap-8 pt-10 pb-0 px-0 absolute top-[3602px] left-4 bg-colors-white-1000 rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start justify-center gap-8 px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-100 text-base tracking-[0] leading-6 whitespace-nowrap">
            🔥 Obľúbené u nás
          </div>

          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-2xl tracking-[0] leading-6 whitespace-nowrap">
              TESLA Model S
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-sm tracking-[0] leading-5">
              Ako jedna z mála autopožičovní na slovensku� máme v ponuke 2 Tesly
              Model S. Tesly sú �dostupné k prenájmu už od jedného dňa. �Či už ste
              priaznovcom elektromobility �alebo nie, vyskúšajte si jazdu v
              najznámejšom �elektromobile sveta.
            </p>
          </div>
        </div>

        <TlacitkoNaTmavememWrapper
          className="!bg-colors-light-yellow-accent-100"
          divClassName="!text-colors-dark-yellow-accent-100"
          text="Detail ponuky"
          tlacitkoNaTmavemem40="normal"
        />
      </div>

      <div className="relative flex-1 self-stretch w-full grow bg-blend-multiply bg-[url(/img/frame-969.png)] bg-cover bg-[50%_50%]" />

      <div className="inline-flex items-center gap-2 absolute top-[532px] left-[142px]">
        <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />
      </div>
    </div>
  );
};
