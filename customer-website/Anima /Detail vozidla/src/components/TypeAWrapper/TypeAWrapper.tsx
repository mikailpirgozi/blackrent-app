/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px51 } from "../../icons/Icon24Px51";
import { TypFacebook } from "../../icons/TypFacebook";
import { TypInstagram } from "../../icons/TypInstagram";
import { Component } from "../Component";
import { Faq } from "../Faq";
import { RychlyKontaktMobil } from "../RychlyKontaktMobil";
import { UnderFooter } from "../UnderFooter";

interface Props {
  type: "a";
  className: any;
  componentBlackrentLogoClassName: any;
  componentIcon: JSX.Element;
  override: JSX.Element;
  componentIcon1: JSX.Element;
  componentVector: string;
  rychlyKontaktMobilLine: string;
  rychlyKontaktMobilFotkaOperToraClassName: any;
  rychlyKontaktMobilVector: string;
  href: string;
}

export const TypeAWrapper = ({
  type,
  className,
  componentBlackrentLogoClassName,
  componentIcon = (
    <TypInstagram className="!relative !w-6 !h-6" color="#BEBEC3" />
  ),
  override = <Icon24Px51 className="!relative !w-6 !h-6" color="#BEBEC3" />,
  componentIcon1 = (
    <TypFacebook className="!relative !w-6 !h-6" color="#BEBEC3" />
  ),
  componentVector = "/img/vector-7.svg",
  rychlyKontaktMobilLine = "/img/line-21-1.svg",
  rychlyKontaktMobilFotkaOperToraClassName,
  rychlyKontaktMobilVector = "/img/vector-3.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-start relative ${className}`}>
      <Faq className="!flex-[0_0_auto]" />
      <div className="inline-flex flex-col h-[1300px] items-center justify-end relative bg-colors-black-300">
        <Component
          blackrentLogoClassName={componentBlackrentLogoClassName}
          className="!flex-[0_0_auto]"
          icon={componentIcon1}
          icon1={override}
          override={componentIcon}
          property1="frame-994"
          vector={componentVector}
        />
        <UnderFooter property1="default" />
        <RychlyKontaktMobil
          className="!absolute !left-4 !top-12"
          fotkaOperToraClassName={rychlyKontaktMobilFotkaOperToraClassName}
          href={href}
          line={rychlyKontaktMobilLine}
          property1="variant-3"
          vector={rychlyKontaktMobilVector}
        />
      </div>
    </div>
  );
};

TypeAWrapper.propTypes = {
  type: PropTypes.oneOf(["a"]),
  componentVector: PropTypes.string,
  rychlyKontaktMobilLine: PropTypes.string,
  rychlyKontaktMobilVector: PropTypes.string,
  href: PropTypes.string,
};
