/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { FooterWrapper } from "../FooterWrapper";
import { TestDWrapper } from "../TestDWrapper";
import { UnderFooter2 } from "../UnderFooter2";

interface Props {
  type: "b";
  className: any;
  footerWrapperVector: string;
  footerWrapperBlackrentLogoClassName: any;
  testDWrapperLine: string;
  testDWrapperFotkaOperToraClassName: any;
  testDWrapperVector: string;
  href: string;
}

export const FaqRychlyKontaktFooter1728 = ({
  type,
  className,
  footerWrapperVector = "/img/vector-29.svg",
  footerWrapperBlackrentLogoClassName,
  testDWrapperLine = "/img/line-9-5.svg",
  testDWrapperFotkaOperToraClassName,
  testDWrapperVector = "/img/vector-28.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative rounded-[40px_40px_0px_0px] ${className}`}
    >
      <div className="inline-flex flex-col items-center pt-56 pb-0 px-0 relative flex-[0_0_auto]">
        <FooterWrapper
          blackrentLogoClassName={footerWrapperBlackrentLogoClassName}
          className="!relative"
          vector={footerWrapperVector}
        />
        <UnderFooter2 property1="default" />
        <TestDWrapper
          className="!absolute !left-[200px] !top-12"
          fotkaOperToraClassName={testDWrapperFotkaOperToraClassName}
          href={href}
          line={testDWrapperLine}
          test="d"
          vector={testDWrapperVector}
        />
      </div>
    </div>
  );
};

FaqRychlyKontaktFooter1728.propTypes = {
  type: PropTypes.oneOf(["b"]),
  footerWrapperVector: PropTypes.string,
  testDWrapperLine: PropTypes.string,
  testDWrapperVector: PropTypes.string,
  href: PropTypes.string,
};
