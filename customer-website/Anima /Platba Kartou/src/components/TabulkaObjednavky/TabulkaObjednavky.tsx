/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px69 } from "../../icons/Icon24Px69";
import { PrimaryButtons } from "../PrimaryButtons";

interface Props {
  typ: "po-vyplnen-short";
  className: any;
  primaryButtons: JSX.Element;
}

export const TabulkaObjednavky = ({
  typ,
  className,
  primaryButtons = (
    <Icon24Px69 className="!relative !w-6 !h-6" color="#141900" />
  ),
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[743px] items-center gap-4 pt-6 pb-8 px-0 relative bg-colors-black-400 border-t [border-top-style:solid] border-colors-black-800 ${className}`}
    >
      <div className="flex flex-col items-center gap-6 px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex h-10 items-center justify-between px-4 py-0 relative self-stretch w-full">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </div>

          <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl text-right tracking-[0] leading-6 whitespace-nowrap">
              870 €
            </div>

            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
              vrátane DPH
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center justify-around gap-2 pl-4 pr-0 py-4 relative self-stretch w-full rounded-lg">
          <PrimaryButtons
            className="!mt-[-16.00px] !mb-[-16.00px] !justify-center !flex-1 !flex !grow"
            divClassName="!text-sm"
            override={primaryButtons}
            text="Osobné údaje a platba"
            tlacitkoNaTmavem="normal"
          />
        </div>
      </div>
    </div>
  );
};

TabulkaObjednavky.propTypes = {
  typ: PropTypes.oneOf(["po-vyplnen-short"]),
};
