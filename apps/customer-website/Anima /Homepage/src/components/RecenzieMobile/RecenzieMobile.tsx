/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { KartaRecenzieMobil } from "../KartaRecenzieMobil";

interface Props {
  className: any;
  kartaRecenzieMobilFrameClassName: any;
  kartaRecenzieMobilFrameClassNameOverride: any;
  kartaRecenzieMobilDivClassName: any;
  kartaRecenzieMobilDivClassNameOverride: any;
}

export const RecenzieMobile = ({
  className,
  kartaRecenzieMobilFrameClassName,
  kartaRecenzieMobilFrameClassNameOverride,
  kartaRecenzieMobilDivClassName,
  kartaRecenzieMobilDivClassNameOverride,
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-wrap items-start gap-[0px_24px] relative ${className}`}
    >
      <KartaRecenzieMobil
        divClassName="!mr-[-5.00px]"
        divClassNameOverride="!mr-[-5.00px] !text-xs !leading-[18px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        icon={<Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor&nbsp;&nbsp;amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Lucia Dubecká"
        type="mobile"
      />
      <KartaRecenzieMobil
        className="bg-[url(/img/karta-recenzie-mobil-13.png)]"
        divClassName="!mr-[-5.00px]"
        divClassNameOverride="!mr-[-5.00px] !text-xs !leading-[18px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilFrameClassName}
        icon={<Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Jakub B."
        type="mobile"
      />
      <KartaRecenzieMobil
        className="bg-[url(/img/karta-recenzie-mobil-14.png)]"
        divClassName="!mr-[-5.00px]"
        divClassNameOverride="!mr-[-5.00px] !text-xs !leading-[18px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilFrameClassNameOverride}
        icon={<Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Tibor Straka"
        type="mobile"
      />
      <KartaRecenzieMobil
        className="bg-[url(/img/karta-recenzie-mobil-15.png)]"
        divClassName="!mr-[-5.00px]"
        divClassNameOverride="!mr-[-5.00px] !text-xs !leading-[18px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilDivClassName}
        icon={<Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor&nbsp;&nbsp;amet, consectetur adipiscing elit.Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Michal Stanko"
        type="mobile"
      />
      <KartaRecenzieMobil
        className="bg-[url(/img/karta-recenzie-mobil-16.png)]"
        divClassName="!mr-[-5.00px]"
        divClassNameOverride="!mr-[-5.00px] !text-xs !leading-[18px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilDivClassNameOverride}
        icon={<Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Ondrej"
        type="mobile"
      />
    </div>
  );
};
