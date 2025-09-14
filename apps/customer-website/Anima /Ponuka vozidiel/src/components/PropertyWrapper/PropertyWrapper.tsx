/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypeArrowSmallDown } from "../../icons/TypeArrowSmallDown";

interface Props {
  property1: "variant-4";
  className: any;
}

export const PropertyWrapper = ({
  property1,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[1440px] items-center gap-2 pt-[200px] pb-60 px-2 relative bg-colors-black-300 rounded-[40px_40px_0px_0px] overflow-hidden ${className}`}
    >
      <div className="flex flex-col w-[1120px] items-center gap-[120px] relative flex-[0_0_auto]">
        <div className="relative w-[300px] h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[40px] text-center tracking-[0] leading-6">
          Časté otázky
        </div>

        <div className="flex items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative flex-1 grow">
            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Čo je zahrnuté v cene prenájmu?
                  </p>
                </div>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    V akom stave je vozidlo pri odovzdaní nájomcovi?
                  </p>
                </div>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Do ktorých krajín môžem s vozidlom vycestovať?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Môžem cestovať aj do krajín mimo Európskej Únie?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Ako môžem platiť za prenájom vozidla?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 relative flex-1 grow">
            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Majú vozidlá diaľničnú známku?
                  </div>
                </div>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Je možná preprava zvierat?
                  </div>
                </div>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Ako mám postupovať keď viem, že budem meškať?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <p className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čo znamená jeden deň prenájmu?
                </p>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>

            <div className="flex flex-col items-start justify-center gap-2 pl-6 pr-4 py-5 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg">
              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Čo ak dostanem pokutu?
                </div>

                <TypeArrowSmallDown
                  className="!relative !w-6 !h-6"
                  color="#D7FF14"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PropertyWrapper.propTypes = {
  property1: PropTypes.oneOf(["variant-4"]),
};
