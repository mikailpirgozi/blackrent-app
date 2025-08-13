/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { Footer } from "../Footer";
import { PropertyWrapper } from "../PropertyWrapper";
import { RychlyKontakt } from "../RychlyKontakt";
import { UnderFooter1 } from "../UnderFooter1";

interface Props {
  type: "a";
  className: any;
  footerBlackrentLogo?: string;
  href?: string;
}

export const FaqRychlyKontakt = ({
  type,
  className,
  footerBlackrentLogo = "https://c.animaapp.com/h23eak6p/img/blackrent-logo-4.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative bg-colors-black-300 rounded-[80px_80px_0px_0px] ${className}`}
    >
      <PropertyWrapper className="!flex-[0_0_auto]" property1="variant-4" />
      <div className="inline-flex flex-col items-center pt-56 pb-0 px-0 relative flex-[0_0_auto]">
        <Footer blackrentLogo={footerBlackrentLogo} className="!relative" />
        <UnderFooter1 property1="default" />
        <RychlyKontakt
          className="!absolute !left-40 !top-12"
          href={href}
          type="c"
        />
      </div>
    </div>
  );
};
