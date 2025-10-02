/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px53 } from "../../icons/Icon24Px53";
import { Icon24Px55 } from "../../icons/Icon24Px55";

interface Props {
  property1: "x";
  className: any;
  href: string;
}

export const PropertyXWrapper = ({
  property1,
  className,
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[680px] items-center pt-24 pb-[72px] px-0 relative bg-colors-white-800 rounded-3xl ${className}`}
    >
      <div className="absolute w-[158px] h-[336px] top-0 left-0 rounded-3xl overflow-hidden">
        <img
          className="absolute w-[120px] h-[296px] top-10 left-0"
          alt="Vector"
          src="/img/vector-26.svg"
        />
      </div>

      <div className="absolute w-[104px] h-[104px] -top-12 left-72 rounded-[99px] border border-solid border-colors-white-800 bg-[url(/img/fotka-oper-tora-7.png)] bg-cover bg-[50%_50%]" />

      <div className="absolute w-3.5 h-3.5 top-[33px] left-[369px] bg-colors-green-accent-500 rounded-[7px] border border-solid border-colors-white-800" />

      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
          <p className="relative self-stretch h-14 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-[32px] text-center tracking-[0] leading-8">
            Potrebujete poradiť? <br />
            Sme tu pre vás.
          </p>

          <p className="relative self-stretch h-4 [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-200 text-base text-center tracking-[0] leading-6 whitespace-nowrap">
            Sme na príjme Po–Pia 08:00–17:00
          </p>
        </div>

        <div className="inline-flex h-10 items-center justify-center gap-4 relative">
          <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
            <Icon24Px53 className="!relative !w-6 !h-6" color="#8CA40C" />
            <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
              <a
                className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-xl tracking-[0] leading-6 whitespace-nowrap"
                href={href}
                rel="noopener noreferrer"
                target="_blank"
              >
                +421 910 666 949
              </a>
            </div>
          </div>

          <img
            className="relative self-stretch w-px mt-[-0.50px] mb-[-0.50px]"
            alt="Line"
            src="/img/line-9-5.svg"
          />

          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <Icon24Px55 className="!relative !w-6 !h-6" color="#8CA40C" />
            <div className="inline-flex flex-col items-start gap-4 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-xl tracking-[0] leading-6 whitespace-nowrap">
                info@blackrent.sk
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PropertyXWrapper.propTypes = {
  property1: PropTypes.oneOf(["x"]),
  href: PropTypes.string,
};
