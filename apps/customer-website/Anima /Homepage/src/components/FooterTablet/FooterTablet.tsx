/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { TypArrowRight } from "../../icons/TypArrowRight";
import { ConcreteComponentNode } from "../ConcreteComponentNode";
import { Faq744 } from "../Faq744";
import { PropertyDefaultWrapper } from "../PropertyDefaultWrapper";
import { PropertyXWrapper } from "../PropertyXWrapper";

interface Props {
  type: "a";
  className: any;
  propertyDefaultWrapperEMailNewsletterPrimaryButtons40PxIconIcon: JSX.Element;
  href: string;
}

export const FooterTablet = ({
  type,
  className,
  propertyDefaultWrapperEMailNewsletterPrimaryButtons40PxIconIcon = (
    <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />
  ),
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-start gap-12 relative bg-colors-black-300 rounded-[40px_40px_0px_0px] ${className}`}
    >
      <Faq744 className="!flex-[0_0_auto]" type="default" />
      <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-center pt-64 pb-0 px-0 relative flex-[0_0_auto]">
          <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
            <PropertyDefaultWrapper
              className="!flex-[0_0_auto]"
              eMailNewsletterPrimaryButtons40PxIconIcon={
                propertyDefaultWrapperEMailNewsletterPrimaryButtons40PxIconIcon
              }
              property1="default"
            />
          </div>

          <PropertyXWrapper
            className="!absolute !left-8 !top-0"
            href={href}
            property1="x"
          />
        </div>

        <ConcreteComponentNode property1="default" />
      </div>
    </div>
  );
};

FooterTablet.propTypes = {
  type: PropTypes.oneOf(["a"]),
  href: PropTypes.string,
};
