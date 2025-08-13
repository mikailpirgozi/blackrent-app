/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { ConcreteComponentNode } from "../ConcreteComponentNode";
import { Faq744 } from "../Faq744";
import { InteractiveFaq744 } from "../Faq744/InteractiveFaq744";
import { PropertyDefaultWrapper } from "../PropertyDefaultWrapper";
import { PropertyXWrapper } from "../PropertyXWrapper";

interface Props {
  type: "a";
  className: any;
  FAQ744IconPxFilledTypeArrowSmall?: string;
  FAQ744IconPxFilledImg?: string;
  FAQ744IconPxFilledTypeArrowSmall1?: string;
  FAQ744IconPxFilledTypeArrowSmall2?: string;
  FAQ744IconPxFilledTypeArrowSmall3?: string;
  FAQ744IconPxFilledTypeArrowSmall4?: string;
  FAQ744IconPxFilledTypeArrowSmall5?: string;
  FAQ744IconPxFilledTypeArrowSmall6?: string;
  FAQ744IconPxFilledTypeArrowSmall7?: string;
  FAQ744IconPxFilledTypeArrowSmall8?: string;
  FAQ744IconPxFilledTypeArrowSmall9?: string;
  propertyDefaultWrapperBlackrentLogo?: string;
  propertyXWrapperFrame?: string;
  href?: string;
}

export const FooterTablet = ({
  type,
  className,
  FAQ744IconPxFilledTypeArrowSmall = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledImg = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall1 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall2 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall3 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall4 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall5 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall6 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall7 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall8 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  FAQ744IconPxFilledTypeArrowSmall9 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  propertyDefaultWrapperBlackrentLogo = "https://c.animaapp.com/h23eak6p/img/blackrent-logo-2.svg",
  propertyXWrapperFrame = "https://c.animaapp.com/h23eak6p/img/frame-2608626.svg",
  href,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-start gap-12 relative bg-colors-black-300 rounded-[40px_40px_0px_0px] ${className}`}
    >
      <InteractiveFaq744
        className="!flex-[0_0_auto]"
        iconPxFilledImg={FAQ744IconPxFilledTypeArrowSmall8}
        iconPxFilledTypeArrowSmall={FAQ744IconPxFilledTypeArrowSmall3}
        iconPxFilledTypeArrowSmall1={FAQ744IconPxFilledImg}
        iconPxFilledTypeArrowSmall2={FAQ744IconPxFilledTypeArrowSmall4}
        iconPxFilledTypeArrowSmall3={FAQ744IconPxFilledTypeArrowSmall5}
        iconPxFilledTypeArrowSmall4={FAQ744IconPxFilledTypeArrowSmall9}
        iconPxFilledTypeArrowSmall5={FAQ744IconPxFilledTypeArrowSmall}
        iconPxFilledTypeArrowSmall6={FAQ744IconPxFilledTypeArrowSmall7}
        iconPxFilledTypeArrowSmall7={FAQ744IconPxFilledTypeArrowSmall1}
        iconPxFilledTypeArrowSmall8={FAQ744IconPxFilledTypeArrowSmall6}
        iconPxFilledTypeArrowSmall9={FAQ744IconPxFilledTypeArrowSmall2}
        type="default"
      />
      <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-center pt-64 pb-0 px-0 relative flex-[0_0_auto]">
          <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
            <PropertyDefaultWrapper
              blackrentLogo={propertyDefaultWrapperBlackrentLogo}
              className="!flex-[0_0_auto]"
              property1="default"
            />
          </div>

          <PropertyXWrapper
            className="!absolute !left-8 !top-0"
            frame={propertyXWrapperFrame}
            href={href}
            property1="x"
          />
        </div>

        <ConcreteComponentNode property1="default" />
      </div>
    </div>
  );
};
