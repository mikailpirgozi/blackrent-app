import React from "react";
import { ElementIconsDarkBig } from "../../../../components/ElementIconsDarkBig";
import { Mapa } from "../../../../components/Mapa";
import { Icon16Px20 } from "../../../../icons/Icon16Px20";

export const DivWrapper = (): JSX.Element => {
  return (
    <div className="inline-flex flex-col items-center gap-10 absolute top-[1750px] left-4">
      <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-center gap-10 relative flex-[0_0_auto]">
          <ElementIconsDarkBig
            ellipse="/img/ellipse-79-1.svg"
            overlapGroupClassName="bg-[url(/img/ellipse-80-1.svg)]"
            type="pin"
            vector="/img/vector-24.svg"
          />
          <div className="inline-flex flex-col items-center gap-8 relative flex-[0_0_auto]">
            <div className="inline-flex flex-col h-4 items-center gap-8 relative">
              <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl text-center tracking-[0] leading-7 whitespace-nowrap">
                Kde sa auto nachádza?
              </div>
            </div>

            <div className="flex flex-col w-[328px] items-center gap-4 relative flex-[0_0_auto]">
              <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
                Bratislava – Záhorská Bystrica
              </div>

              <p className="relative self-stretch h-2 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-xs text-center tracking-[0] leading-[30px] whitespace-nowrap">
                Pobočka Avis cars, Rozmarínova 23 Trenčín
              </p>
            </div>
          </div>
        </div>

        <Mapa
          className="!bg-[50%_50%] !bg-cover bg-[url(/img/mapa-3.png)] !w-[328px]"
          property1="a"
        />
      </div>

      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
        <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap">
          Zobraziť na mape
        </div>

        <Icon16Px20 className="!relative !w-4 !h-4" />
      </div>
    </div>
  );
};
