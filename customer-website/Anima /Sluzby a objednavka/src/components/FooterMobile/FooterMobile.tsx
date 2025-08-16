/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Component } from "../Component";
import { UnderFooter } from "../UnderFooter";

interface Props {
  type: "c";
  className: any;
}

export const FooterMobile = ({ type, className }: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-start relative ${className}`}>
      <div className="inline-flex flex-col items-center justify-end relative flex-[0_0_auto] bg-colors-black-300">
        <Component className="!flex-[0_0_auto]" property1="frame-994" />
        <UnderFooter property1="default" />
      </div>
    </div>
  );
};

FooterMobile.propTypes = {
  type: PropTypes.oneOf(["c"]),
};
