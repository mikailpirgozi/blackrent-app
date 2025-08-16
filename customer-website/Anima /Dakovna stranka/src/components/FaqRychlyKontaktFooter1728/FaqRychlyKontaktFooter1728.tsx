/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { FooterWrapper } from "../FooterWrapper";
import { UnderFooter2 } from "../UnderFooter2";

interface Props {
  type: "c";
  className: any;
  footerWrapperBlackrentLogoClassName: any;
  footerWrapperVector: string;
}

export const FaqRychlyKontaktFooter1728 = ({
  type,
  className,
  footerWrapperBlackrentLogoClassName,
  footerWrapperVector = "/img/vector-20.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative rounded-[40px_40px_0px_0px] ${className}`}
    >
      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
        <FooterWrapper
          blackrentLogoClassName={footerWrapperBlackrentLogoClassName}
          className="!relative"
          vector={footerWrapperVector}
        />
        <UnderFooter2 property1="default" />
      </div>
    </div>
  );
};

FaqRychlyKontaktFooter1728.propTypes = {
  type: PropTypes.oneOf(["c"]),
  footerWrapperVector: PropTypes.string,
};
