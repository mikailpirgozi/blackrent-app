/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { FooterWrapper } from "../FooterWrapper";
import { PropertyFrameWrapper } from "../PropertyFrameWrapper";
import { InteractivePropertyFrameWrapper } from "../PropertyFrameWrapper/InteractivePropertyFrameWrapper";
import { TestDWrapper } from "../TestDWrapper";
import { UnderFooter2 } from "../UnderFooter2";

interface Props {
  type: "a";
  className: any;
  footerWrapperBlackrentLogo?: string;
  href?: string;
}

export const FaqRychlyKontaktFooter1728 = ({
  type,
  className,
  footerWrapperBlackrentLogo = "https://c.animaapp.com/h23eak6p/img/blackrent-logo-6.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative bg-colors-black-300 rounded-[40px_40px_0px_0px] ${className}`}
    >
      <InteractivePropertyFrameWrapper
        className="!flex-[0_0_auto]"
        property1="frame-375"
      />
      <div className="inline-flex flex-col items-center pt-56 pb-0 px-0 relative flex-[0_0_auto]">
        <FooterWrapper
          blackrentLogo={footerWrapperBlackrentLogo}
          className="!relative"
        />
        <UnderFooter2 property1="default" />
        <TestDWrapper
          className="!absolute !left-[200px] !top-12"
          href={href}
          test="d"
        />
      </div>
    </div>
  );
};
