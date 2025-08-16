/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px111 } from "../../icons/Icon24Px111";
import { PrimaryButtons } from "../PrimaryButtons";

interface Props {
  type: "two";
  className: any;
  primaryButtons: JSX.Element;
  frameClassName: any;
}

export const BannerStandard = ({
  type,
  className,
  primaryButtons = (
    <Icon24Px111 className="!relative !w-6 !h-6" color="#141900" />
  ),
  frameClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[1120px] h-[424px] items-center justify-between pl-24 pr-0 py-0 relative bg-colors-white-1000 rounded-3xl overflow-hidden ${className}`}
    >
      <div className="flex flex-col w-[448px] items-start justify-center gap-12 relative">
        <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-100 text-xl tracking-[0] leading-6 whitespace-nowrap">
            🔥 Obľúbené u nás
          </div>

          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-black-600 text-[40px] tracking-[0] leading-6 whitespace-nowrap">
              TESLA Model S
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-base tracking-[0] leading-6">
              Ako jedna z mála autopožičovní na slovensku� máme
              <br />v ponuke 2 Tesly Model S. Tesly sú �dostupné
              <br />k prenájmu už od jedného dňa. �Či už ste priaznovcom
              elektromobility �alebo nie, vyskúšajte si jazdu v najznámejšom
              �elektromobile sveta.
            </p>
          </div>
        </div>

        <PrimaryButtons
          className=""
          divClassName="!text-colors-dark-yellow-accent-200"
          override={primaryButtons}
          text="Detail ponuky"
          tlacitkoNaTmavem="normal"
        />
      </div>

      <img
        className={`relative flex-1 self-stretch grow bg-blend-multiply ${frameClassName}`}
        alt="Frame"
        src="/img/frame-968.png"
      />

      <div className="inline-flex items-center justify-center gap-2 absolute top-[396px] left-[538px]">
        <div className="relative w-3 h-3 bg-colors-ligh-gray-200 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />

        <div className="relative w-2 h-2 bg-colors-ligh-gray-800 rounded-[99px]" />
      </div>
    </div>
  );
};

BannerStandard.propTypes = {
  type: PropTypes.oneOf(["two"]),
};
