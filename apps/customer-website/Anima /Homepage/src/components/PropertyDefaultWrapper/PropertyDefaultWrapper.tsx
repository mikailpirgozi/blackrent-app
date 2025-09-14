/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px63 } from "../../icons/Icon24Px63";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { TypFacebook } from "../../icons/TypFacebook";
import { TypInstagram } from "../../icons/TypInstagram";
import { EMailNewsletter } from "../EMailNewsletter";

interface Props {
  property1: "default";
  className: any;
  eMailNewsletterPrimaryButtons40PxIconIcon: JSX.Element;
}

export const PropertyDefaultWrapper = ({
  property1,
  className,
  eMailNewsletterPrimaryButtons40PxIconIcon = (
    <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />
  ),
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[744px] items-start justify-center gap-2 pt-40 pb-[120px] px-0 relative bg-colors-black-100 overflow-hidden ${className}`}
    >
      <div className="absolute w-[277px] h-[619px] top-96 left-[492px]">
        <img
          className="absolute w-[252px] h-[349px] top-0 left-0"
          alt="Vector"
          src="/img/vector-15.svg"
        />
      </div>

      <div className="flex flex-col w-[506px] items-start gap-16 relative">
        <div className="relative w-[214.4px] h-8 bg-[url(/img/vector-29.svg)] bg-[100%_100%]" />

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-[131px] h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Newsletter
            </div>

            <p className="relative w-[341px] h-2 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-sm tracking-[0] leading-6">
                Prihláste sa na newsletter a získajte&nbsp;&nbsp;
              </span>

              <span className="font-semibold">5€ voucher</span>

              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#bebec3] text-sm tracking-[0] leading-6">
                !
              </span>
            </p>
          </div>

          <EMailNewsletter
            className="!self-stretch !flex-[0_0_auto] !w-full"
            divClassName=""
            primaryButtons40PxIconIcon={
              eMailNewsletterPrimaryButtons40PxIconIcon
            }
            type="default-b"
          />
        </div>

        <div className="flex items-start justify-between relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col w-[166px] items-start gap-6 relative">
            <div className="relative self-stretch mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
              Mapa stránok
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
              Ponuka vozidiel <br />
              Store
              <br />
              Služby
              <br />O nás <br />
              Kontakt <br />
              Prihlásenie / Prihlásenie
            </p>
          </div>

          <div className="flex flex-col w-[178px] items-start gap-6 relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Kontaktné informácie
            </div>

            <div className="inline-flex flex-col items-start gap-[17px] relative flex-[0_0_auto]">
              <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
                Rozmarínová 211/3
                <br />
                91101 Trenčín
                <br />
                +421 910 666 949
                <br />
                info@blackrent.sk
              </p>
            </div>
          </div>

          <div className="flex flex-col w-[104px] items-start gap-6 relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Sledujte nás
            </div>

            <div className="inline-flex items-start gap-4 relative flex-[0_0_auto]">
              <TypFacebook className="!relative !w-6 !h-6" color="#A0A0A5" />
              <TypInstagram className="!relative !w-6 !h-6" color="#A0A0A5" />
              <Icon24Px63 className="!relative !w-6 !h-6" color="#A0A0A5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PropertyDefaultWrapper.propTypes = {
  property1: PropTypes.oneOf(["default"]),
};
