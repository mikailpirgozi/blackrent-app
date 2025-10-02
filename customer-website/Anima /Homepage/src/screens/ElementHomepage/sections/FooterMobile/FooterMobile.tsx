import React from "react";
import { TypeAWrapper } from "../../../../components/TypeAWrapper";
import { TypArrowRight } from "../../../../icons/TypArrowRight";

export const FooterMobile = (): JSX.Element => {
  return (
    <TypeAWrapper
      className="!absolute !left-0 !top-[935px]"
      componentEMailNewsletterPrimaryButtons40PxIconIcon={
        <TypArrowRight className="!relative !w-4 !h-4" color="#141900" />
      }
      href="tel:+421 910 666 949"
      type="a"
    />
  );
};
