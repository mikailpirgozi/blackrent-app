/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { KartaRecenzie } from "../KartaRecenzie";
import { KartaRecenzieMobil } from "../KartaRecenzieMobil";

interface Props {
  className: any;
  kartaRecenzieMobilIcon: JSX.Element;
  override: JSX.Element;
  kartaRecenzieMobilFrameClassName: any;
  kartaRecenzieMobilIcon1: JSX.Element;
  kartaRecenzieMobilFrameClassNameOverride: any;
  kartaRecenzieIcon: JSX.Element;
  kartaRecenzieIcon1: JSX.Element;
  kartaRecenzieIcon2: JSX.Element;
  kartaRecenzieMobilIcon2: JSX.Element;
}

export const RecenzieDesktop = ({
  className,
  kartaRecenzieMobilIcon = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  override = <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />,
  kartaRecenzieMobilFrameClassName,
  kartaRecenzieMobilIcon1 = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  kartaRecenzieMobilFrameClassNameOverride,
  kartaRecenzieIcon = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  kartaRecenzieIcon1 = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  kartaRecenzieIcon2 = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  kartaRecenzieMobilIcon2 = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex items-start gap-8 pl-[200px] pr-8 py-0 relative overflow-x-scroll ${className}`}
    >
      <KartaRecenzie icon={kartaRecenzieIcon2} type="default" />
      <KartaRecenzieMobil
        className="!h-96 bg-[url(/img/karta-recenzie-mobil-13.png)] !w-[308px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        icon={kartaRecenzieMobilIcon}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Jakub B."
        type="mobile"
      />
      <KartaRecenzieMobil
        className="!h-96 bg-[url(/img/karta-recenzie-mobil-14.png)] !w-[308px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        icon={override}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Tibor Straka"
        type="mobile"
      />
      <KartaRecenzieMobil
        className="!h-96 bg-[url(/img/karta-recenzie-mobil-15.png)] !w-[308px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilFrameClassName}
        icon={kartaRecenzieMobilIcon1}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Michal Stanko"
        type="mobile"
      />
      <KartaRecenzieMobil
        className="!h-96 bg-[url(/img/karta-recenzie-mobil-16.png)] !w-[308px]"
        frameClassName="!self-stretch !mr-[unset] !flex !w-full"
        frameClassNameOverride={kartaRecenzieMobilFrameClassNameOverride}
        icon={kartaRecenzieMobilIcon2}
        text="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        text1="Ondrej"
        type="mobile"
      />
      <KartaRecenzie icon={kartaRecenzieIcon} type="default" />
      <KartaRecenzie icon={kartaRecenzieIcon1} type="default" />
    </div>
  );
};
