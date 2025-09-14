/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { FooterWrapper } from "../FooterWrapper";
import { UnderFooter1 } from "../UnderFooter1";

interface Props {
  type: "c";
  className: any;
}

export const TypeCWrapper = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative rounded-[40px_40px_0px_0px] ${className}`}
    >
      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
        <FooterWrapper className="!relative" />
        <UnderFooter1 property1="default" />
      </div>
    </div>
  );
};

TypeCWrapper.propTypes = {
  type: PropTypes.oneOf(["c"]),
};
