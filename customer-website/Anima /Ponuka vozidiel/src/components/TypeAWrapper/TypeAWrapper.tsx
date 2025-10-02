/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Component } from "../Component";
import { Faq } from "../Faq";
import { RychlyKontaktMobil } from "../RychlyKontaktMobil";
import { UnderFooter } from "../UnderFooter";

interface Props {
  type: "a";
  className: any;
  href: string;
}

export const TypeAWrapper = ({ type, className, href }: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-start relative ${className}`}>
      <Faq className="!flex-[0_0_auto]" />
      <div className="inline-flex flex-col h-[1300px] items-center justify-end relative bg-colors-black-300">
        <Component className="!flex-[0_0_auto]" property1="frame-994" />
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

TypeAWrapper.propTypes = {
  type: PropTypes.oneOf(["a"]),
  href: PropTypes.string,
};
