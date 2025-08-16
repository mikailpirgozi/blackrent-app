/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Footer } from "../Footer";
import { UnderFooter1 } from "../UnderFooter1";

interface Props {
  type: "c";
  className: any;
  footerVector: string;
  footerBlackrentLogoClassName: any;
}

export const FaqRychlyKontakt = ({
  type,
  className,
  footerVector = "/img/vector-16.svg",
  footerBlackrentLogoClassName,
}: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-center relative ${className}`}>
      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
        <Footer
          blackrentLogoClassName={footerBlackrentLogoClassName}
          className="!relative"
          vector={footerVector}
        />
        <UnderFooter1 property1="default" />
      </div>
    </div>
  );
};

FaqRychlyKontakt.propTypes = {
  type: PropTypes.oneOf(["c"]),
  footerVector: PropTypes.string,
};
