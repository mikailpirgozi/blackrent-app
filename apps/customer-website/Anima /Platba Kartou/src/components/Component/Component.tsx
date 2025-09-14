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
  property1: "frame-994";
  className: any;
}

export const Component = ({ property1, className }: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[360px] items-start gap-2 pt-40 pb-20 px-8 relative bg-colors-black-100 ${className}`}
    >
      <div className="flex flex-col items-start gap-14 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-[214.4px] h-8 bg-[url(/img/vector-30.svg)] bg-[100%_100%]" />

          <div className="flex flex-col items-start gap-10 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-2xl tracking-[0] leading-6 whitespace-nowrap">
                Newsletter
              </div>

              <p className="relative self-stretch font-mobil-text-mobil-14-reg font-[number:var(--mobil-text-mobil-14-reg-font-weight)] text-colors-ligh-gray-800 text-[length:var(--mobil-text-mobil-14-reg-font-size)] tracking-[var(--mobil-text-mobil-14-reg-letter-spacing)] leading-[var(--mobil-text-mobil-14-reg-line-height)] [font-style:var(--mobil-text-mobil-14-reg-font-style)]">
                Prihláste sa na newsletter a získajte&nbsp;&nbsp;
                <br />
                5€ voucher!
              </p>
            </div>

            <EMailNewsletter
              className="!self-stretch !flex-[0_0_auto] !w-full"
              divClassName="!text-colors-ligh-gray-200"
              type="default-b"
            />
          </div>
        </div>

        <div className="flex flex-col items-start gap-12 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-5 whitespace-nowrap">
              Mapa stránok
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-6">
              Ponuka vozidiel <br />
              Store
              <br />O nás <br />
              Kontakt <br />
              Prihlásenie / Registrácia
            </p>
          </div>

          <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Kontaktné informácie
            </div>

            <p className="relative self-stretch [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
              Rozmarínová 211/3
              <br />
              91101 Trenčín
              <br />
              +421 910 666 949
              <br />
              info@blackrent.sk
            </p>
          </div>

          <div className="flex flex-col w-40 items-start gap-6 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Sledujte nás
            </div>

            <div className="inline-flex items-start gap-4 relative flex-[0_0_auto]">
              <Icon24Px137 className="!relative !w-6 !h-6" color="#BEBEC3" />
              <Icon24Px138 className="!relative !w-6 !h-6" color="#BEBEC3" />
              <Icon24Px68 className="!relative !w-6 !h-6" color="#BEBEC3" />
            </div>
          </div>

          <div className="absolute w-[172px] h-[386px] top-[201px] left-[156px]">
            <img
              className="absolute w-[172px] h-[292px] top-0 left-0"
              alt="Vector"
              src="/img/vector-7.svg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

Component.propTypes = {
  property1: PropTypes.oneOf(["frame-994"]),
};
