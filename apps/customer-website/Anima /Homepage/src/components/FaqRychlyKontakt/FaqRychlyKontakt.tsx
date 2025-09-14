/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px63 } from "../../icons/Icon24Px63";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { TypFacebook } from "../../icons/TypFacebook";
import { TypInstagram } from "../../icons/TypInstagram";
import { Footer } from "../Footer";
import { PropertyWrapper } from "../PropertyWrapper";
import { RychlyKontakt } from "../RychlyKontakt";
import { UnderFooter1 } from "../UnderFooter1";

interface Props {
  type: "a";
  className: any;
  footerVector: string;
  footerIcon: JSX.Element;
  override: JSX.Element;
  footerBlackrentLogoClassName: any;
  footerIcon1: JSX.Element;
  footerEMailNewsletterPrimaryButtons40PxIconIcon: JSX.Element;
  rychlyKontaktVector: string;
  rychlyKontaktLine: string;
  rychlyKontaktFotkaOperToraClassName: any;
  href: string;
}

export const FaqRychlyKontakt = ({
  type,
  className,
  footerVector = "/img/vector-22.svg",
  footerIcon = <TypFacebook className="!relative !w-6 !h-6" color="#A0A0A5" />,
  override = <TypInstagram className="!relative !w-6 !h-6" color="#A0A0A5" />,
  footerBlackrentLogoClassName,
  footerIcon1 = <Icon24Px63 className="!relative !w-6 !h-6" color="#A0A0A5" />,
  footerEMailNewsletterPrimaryButtons40PxIconIcon = (
    <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />
  ),
  rychlyKontaktVector = "/img/vector-27.svg",
  rychlyKontaktLine = "/img/line-9-5.svg",
  rychlyKontaktFotkaOperToraClassName,
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-center relative bg-colors-black-300 rounded-[80px_80px_0px_0px] ${className}`}
    >
      <PropertyWrapper className="!flex-[0_0_auto]" property1="variant-4" />
      <div className="inline-flex flex-col items-center pt-56 pb-0 px-0 relative flex-[0_0_auto]">
        <Footer
          blackrentLogoClassName={footerBlackrentLogoClassName}
          className="!relative"
          eMailNewsletterPrimaryButtons40PxIconIcon={
            footerEMailNewsletterPrimaryButtons40PxIconIcon
          }
          icon={footerIcon}
          icon1={footerIcon1}
          override={override}
          vector={footerVector}
        />
        <UnderFooter1 property1="default" />
        <RychlyKontakt
          className="!absolute !left-40 !top-12"
          fotkaOperToraClassName={rychlyKontaktFotkaOperToraClassName}
          href={href}
          line={rychlyKontaktLine}
          type="c"
          vector={rychlyKontaktVector}
        />
      </div>
    </div>
  );
};

FaqRychlyKontakt.propTypes = {
  type: PropTypes.oneOf(["a"]),
  footerVector: PropTypes.string,
  rychlyKontaktVector: PropTypes.string,
  rychlyKontaktLine: PropTypes.string,
  href: PropTypes.string,
};
