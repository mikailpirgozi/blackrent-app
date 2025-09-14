/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px68 } from "../../icons/Icon24Px68";
import { Icon24Px137 } from "../../icons/Icon24Px137";
import { Icon24Px138 } from "../../icons/Icon24Px138";
import { EMailNewsletter } from "../EMailNewsletter";

interface Props {
  className: any;
  vector: string;
  blackrentLogoClassName: any;
}

export const FooterWrapper = ({
  className,
  vector = "/img/vector-29.svg",
  blackrentLogoClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`w-[1728px] h-[824px] bg-colors-black-100 overflow-hidden ${className}`}
    >
      <div className="relative w-[1528px] h-[1068px] left-[200px]">
        <div className="absolute w-[476px] h-[1068px] top-0 left-[1052px]">
          <img
            className="absolute w-[476px] h-[824px] top-0 left-0"
            alt="Vector"
            src={vector}
          />
        </div>

        <div className="inline-flex flex-col items-start gap-20 absolute top-[336px] left-0">
          <div
            className={`relative w-[214.4px] h-8 bg-[url(/img/vector-30.svg)] bg-[100%_100%] ${blackrentLogoClassName}`}
          />

          <div className="flex w-[1328px] items-start gap-[258px] relative flex-[0_0_auto]">
            <div className="flex flex-col w-[422px] items-start gap-10 relative">
              <div className="flex flex-col items-start gap-8 relative self-stretch w-full flex-[0_0_auto]">
                <div className="relative w-[109px] h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                  Newsletter
                </div>

                <p className="relative self-stretch h-8 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-5">
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                    Prihláste sa na newsletter a získajte{" "}
                  </span>

                  <span className="font-semibold">5€ voucher </span>

                  <span className="[font-family:'Poppins',Helvetica] font-normal text-[#a0a0a5] text-sm tracking-[0] leading-5">
                    na prenájom vozidla z našej autopožičovňe.
                  </span>
                </p>
              </div>

              <EMailNewsletter
                className="!flex-[0_0_auto] !w-[422px]"
                divClassName=""
                type="default-b"
              />
            </div>

            <div className="flex items-start justify-between relative flex-1 grow">
              <div className="flex flex-col w-[195px] items-start gap-8 relative">
                <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                  Mapa stránok
                </div>

                <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-6">
                  <span className="text-[#a0a0a5]">
                    Ponuka vozidiel <br />
                    Služby
                    <br />
                    Store
                    <br />
                    Kontakt
                    <br />
                  </span>

                  <span className="text-[#f0ff98]">O nás</span>

                  <span className="text-[#e4ff56]">&nbsp;</span>

                  <span className="text-[#a0a0a5]">
                    {"  "}Prihlásenie a Registrácia
                  </span>
                </p>
              </div>

              <div className="flex flex-col w-[195px] items-start gap-10 relative">
                <div className="inline-flex flex-col items-start gap-8 relative flex-[0_0_auto]">
                  <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                    Sídlo spoločnosti
                  </div>

                  <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-200 text-sm tracking-[0] leading-6">
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

              <div className="flex flex-col w-[195px] items-start gap-8 relative">
                <div className="inline-flex flex-col items-start gap-10 relative flex-[0_0_auto]">
                  <div className="relative self-stretch h-4 mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xl tracking-[0] leading-6 whitespace-nowrap">
                    Sledujte nás
                  </div>
                </div>

                <div className="inline-flex items-start gap-4 relative flex-[0_0_auto]">
                  <Icon24Px137
                    className="!relative !w-6 !h-6"
                    color="#A0A0A5"
                  />
                  <Icon24Px138
                    className="!relative !w-6 !h-6"
                    color="#A0A0A5"
                  />
                  <Icon24Px68 className="!relative !w-6 !h-6" color="#A0A0A5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FooterWrapper.propTypes = {
  vector: PropTypes.string,
};
