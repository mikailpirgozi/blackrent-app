/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { Component } from "../Component";
import { Faq } from "../Faq";
import { InteractiveFaq } from "../Faq/InteractiveFaq";
import { RychlyKontaktMobil } from "../RychlyKontaktMobil";
import { UnderFooter } from "../UnderFooter";

interface Props {
  type: "a";
  className: any;
  FAQIconPxFilledTypeArrowSmall?: string;
  FAQIconPxFilledImg?: string;
  FAQIconPxFilledTypeArrowSmall1?: string;
  FAQIconPxFilledTypeArrowSmall2?: string;
  FAQIconPxFilledTypeArrowSmall3?: string;
  FAQIconPxFilledTypeArrowSmall4?: string;
  FAQIconPxFilledTypeArrowSmall5?: string;
  FAQIconPxFilledTypeArrowSmall6?: string;
  componentBlackrentLogo?: string;
  href?: string;
}

export const TypeAWrapper = ({
  type,
  className,
  FAQIconPxFilledTypeArrowSmall = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledImg = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall1 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall2 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall3 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall4 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall5 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQIconPxFilledTypeArrowSmall6 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  componentBlackrentLogo = "https://c.animaapp.com/h23eak6p/img/blackrent-logo.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-start relative ${className}`}>
      <InteractiveFaq
        className="!flex-[0_0_auto]"
        iconPxFilledImg={FAQIconPxFilledTypeArrowSmall3}
        iconPxFilledTypeArrowSmall={FAQIconPxFilledTypeArrowSmall2}
        iconPxFilledTypeArrowSmall1={FAQIconPxFilledTypeArrowSmall6}
        iconPxFilledTypeArrowSmall2={FAQIconPxFilledImg}
        iconPxFilledTypeArrowSmall3={FAQIconPxFilledTypeArrowSmall5}
        iconPxFilledTypeArrowSmall4={FAQIconPxFilledTypeArrowSmall}
        iconPxFilledTypeArrowSmall5={FAQIconPxFilledTypeArrowSmall1}
        iconPxFilledTypeArrowSmall6={FAQIconPxFilledTypeArrowSmall4}
      />
      <div className="inline-flex flex-col h-[1300px] items-center justify-end relative bg-colors-black-300">
        <Component
          blackrentLogo={componentBlackrentLogo}
          className="!flex-[0_0_auto]"
          property1="frame-994"
        />
        <UnderFooter property1="default" />
        <RychlyKontaktMobil
          className="!absolute !left-4 !top-12"
          href={href}
          property1="variant-3"
        />
      </div>
    </div>
  );
};
