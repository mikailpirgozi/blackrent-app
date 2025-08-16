/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px4 } from "../../icons/Icon16Px4";
import { Icon16Px5 } from "../../icons/Icon16Px5";
import { Icon16Px100 } from "../../icons/Icon16Px100";
import { Icon16Px101 } from "../../icons/Icon16Px101";

interface Props {
  className: any;
  icon16Px4Color: string;
  popisClassName: any;
  icon16Px5Color: string;
  popisClassNameOverride: any;
  icon16Px100Color: string;
  divClassName: any;
  icon16Px101Color: string;
  divClassNameOverride: any;
}

export const Frame263 = ({
  className,
  icon16Px4Color = "#F0F0F5",
  popisClassName,
  icon16Px5Color = "#F0F0F5",
  popisClassNameOverride,
  icon16Px100Color = "#F0F0F5",
  divClassName,
  icon16Px101Color = "#F0F0F5",
  divClassNameOverride,
}: Props): JSX.Element => {
  return (
    <div className={`items-start gap-2 inline-flex relative ${className}`}>
      <div className="inline-flex items-center relative flex-[0_0_auto]">
        <Icon16Px4 className="!relative !w-4 !h-4" color={icon16Px4Color} />
        <div
          className={`relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap ${popisClassName}`}
        >
          123 kW
        </div>
      </div>

      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
        <Icon16Px5 className="!relative !w-4 !h-4" color={icon16Px5Color} />
        <div
          className={`relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap ${popisClassNameOverride}`}
        >
          Benzín
        </div>
      </div>

      <div className="items-center gap-1 flex-[0_0_auto] inline-flex relative">
        <Icon16Px100 className="!relative !w-4 !h-4" color={icon16Px100Color} />
        <div
          className={`relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap ${divClassName}`}
        >
          Automat
        </div>
      </div>

      <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
        <Icon16Px101 className="!relative !w-4 !h-4" color={icon16Px101Color} />
        <div
          className={`relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap ${divClassNameOverride}`}
        >
          Predný
        </div>
      </div>
    </div>
  );
};

Frame263.propTypes = {
  icon16Px4Color: PropTypes.string,
  icon16Px5Color: PropTypes.string,
  icon16Px100Color: PropTypes.string,
  icon16Px101Color: PropTypes.string,
};
