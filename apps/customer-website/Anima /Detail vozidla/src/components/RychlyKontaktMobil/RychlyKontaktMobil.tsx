/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px48 } from "../../icons/Icon24Px48";
import { Icon24Px63 } from "../../icons/Icon24Px63";

interface Props {
  property1: "variant-3";
  className: any;
  fotkaOperToraClassName: any;
  vector: string;
  line: string;
  href: string;
}

export const RychlyKontaktMobil = ({
  property1,
  className,
  fotkaOperToraClassName,
  vector = "/img/vector-3.svg",
  line = "/img/line-21-1.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[328px] items-center pt-20 pb-10 px-0 relative bg-colors-white-800 rounded-2xl ${className}`}
    >
      <div
        className={`absolute w-[104px] h-[104px] -top-12 left-28 rounded-[99px] border border-solid border-colors-white-800 bg-[url(/img/fotka-oper-tora-7.png)] bg-cover bg-[50%_50%] ${fotkaOperToraClassName}`}
      />

      <div className="absolute w-3.5 h-3.5 top-[34px] left-[194px] bg-colors-green-accent-500 rounded-[7px] border border-solid border-colors-white-800" />

      <div className="absolute w-16 h-[152px] top-[152px] left-0 rounded-2xl overflow-hidden">
        <div className="relative h-[185px] top-2">
          <img
            className="absolute w-16 h-36 top-0 left-0"
            alt="Vector"
            src={vector}
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
          <p className="relative self-stretch h-10 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-xl text-center tracking-[0] leading-6">
            Potrebujete poradiť? <br />
            Sme tu pre vás.
          </p>

          <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
            Sme na príjme Po–Pia 08:00–17:00
          </p>
        </div>

        <div className="inline-flex flex-col items-center gap-6 relative flex-[0_0_auto]">
          <div className="flex w-[165px] items-center gap-2 relative flex-[0_0_auto]">
            <Icon24Px63 className="!relative !w-6 !h-6" color="#8CA40C" />
            <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
              <a
                className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                +421 910 666 949
              </a>
            </div>
          </div>

          <img
            className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
            alt="Line"
            src={line}
          />

          <div className="flex w-[165px] items-center justify-center gap-2 relative flex-[0_0_auto]">
            <Icon24Px48 className="!relative !w-6 !h-6" color="#8CA40C" />
            <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 whitespace-nowrap">
                info@blackrent.sk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

RychlyKontaktMobil.propTypes = {
  property1: PropTypes.oneOf(["variant-3"]),
  vector: PropTypes.string,
  line: PropTypes.string,
  href: PropTypes.string,
};
