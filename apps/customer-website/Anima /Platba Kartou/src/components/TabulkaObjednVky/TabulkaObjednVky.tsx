/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px69 } from "../../icons/Icon24Px69";
import { PrimaryButtons } from "../PrimaryButtons";

interface Props {
  type: "po-vyplnen-short";
  className: any;
  primaryButtons: JSX.Element;
}

export const TabulkaObjednVky = ({
  type,
  className,
  primaryButtons = (
    <Icon24Px69 className="!relative !w-6 !h-6" color="#141900" />
  ),
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[359px] items-center gap-4 px-0 py-6 relative bg-colors-black-400 border-t [border-top-style:solid] border-colors-black-800 ${className}`}
    >
      <div className="flex flex-col items-center gap-4 px-4 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex h-[37px] items-center justify-between px-2 py-0 relative self-stretch w-full">
            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl tracking-[0] leading-6 whitespace-nowrap">
              Cena
            </div>

            <div className="inline-flex flex-col items-end gap-2 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl text-right tracking-[0] leading-6 whitespace-nowrap">
                870 €
              </div>

              <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
                vrátane DPH
              </div>
            </div>
          </div>
        </div>

        <PrimaryButtons
          className="!justify-center !flex !w-[327px]"
          divClassName=""
          override={primaryButtons}
          text="Osobné údaje a platba"
          tlacitkoNaTmavem="normal"
        />
      </div>
    </div>
  );
};

TabulkaObjednVky.propTypes = {
  type: PropTypes.oneOf(["po-vyplnen-short"]),
};
