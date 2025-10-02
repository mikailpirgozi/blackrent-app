/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { IconPx } from "../IconPx";
import { RecenzieDesktop } from "../RecenzieDesktop";

interface Props {
  type: "a";
  className: any;
  overlapClassName: any;
  recenzieDesktopKartaRecenzieMobilIcon: JSX.Element;
  recenzieDesktopKartaRecenzieMobilFrameClassName: any;
  override: JSX.Element;
  recenzieDesktopKartaRecenzieMobilIcon1: JSX.Element;
  recenzieDesktopKartaRecenzieMobilFrameClassNameOverride: any;
  recenzieDesktopKartaRecenzieIcon: JSX.Element;
  recenzieDesktopKartaRecenzieIcon1: JSX.Element;
}

export const Recenzie = ({
  type,
  className,
  overlapClassName,
  recenzieDesktopKartaRecenzieMobilIcon = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  recenzieDesktopKartaRecenzieMobilFrameClassName,
  override = <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />,
  recenzieDesktopKartaRecenzieMobilIcon1 = (
    <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
  ),
  recenzieDesktopKartaRecenzieMobilFrameClassNameOverride,
  recenzieDesktopKartaRecenzieIcon = <IconPx typ="quote-marks" />,
  recenzieDesktopKartaRecenzieIcon1 = <IconPx typ="quote-marks" />,
}: Props): JSX.Element => {
  return (
    <div
      className={`relative w-[1440px] h-[1112px] bg-colors-white-800 overflow-hidden ${className}`}
    >
      <div className="inline-flex flex-col items-center gap-12 absolute top-[200px] left-[453px]">
        <div className="relative w-[534px] h-[88px] mt-[-1.00px] [font-family:'SF_Pro-ExpandedHeavy',Helvetica] font-normal text-colors-dark-yellow-accent-200 text-5xl text-center tracking-[0] leading-[52px]">
          Skúsenosti našich <br />
          zákazníkov
        </div>

        <p className="w-[437px] h-8 text-colors-dark-gray-600 text-base text-center leading-6 relative [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore
        </p>
      </div>

      <div className="top-[304px] left-[1078px] absolute w-[202px] h-[72px] shadow-[0px_4px_16px_#e6e6ea]">
        <div className="relative w-[195px] h-[65px] left-[7px] bg-[url(/img/rectangle-962-4.svg)] bg-[100%_100%]">
          <div className="absolute h-7 top-[13px] left-[33px] rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-yellow-accent-200 text-sm tracking-[0] leading-[18px]">
            Tisíce spokojných
            <br />
            zákazníkov ročne!
          </div>

          <div className="h-3.5 top-[30px] left-[163px] text-xl leading-[18px] absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
            🤝
          </div>
        </div>
      </div>

      <div className="top-[352px] left-40 absolute w-[202px] h-[72px] shadow-[0px_4px_16px_#e6e6ea]">
        <div className="relative w-[195px] h-[65px] bg-[url(/img/rectangle-962-1.svg)] bg-[100%_100%]">
          <div className="absolute w-[101px] h-8 top-[13px] left-[57px]">
            <div className="h-[13px] top-[19px] left-[78px] rotate-[0.10deg] text-lg leading-[18px] absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
              🤩
            </div>

            <div className="absolute h-7 top-0 left-0 rotate-[0.10deg] [font-family:'Poppins',Helvetica] font-medium text-colors-dark-yellow-accent-200 text-sm tracking-[0] leading-[18px]">
              4,8 hodnotení <br />
              na Google
            </div>
          </div>

          <div className="h-[17px] top-[11px] left-3 rotate-[-15.00deg] text-2xl leading-6 absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
            🌟
          </div>

          <div className="w-5 h-3.5 top-[30px] left-[31px] rotate-[10.28deg] text-xl leading-6 absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
            ⭐
          </div>
        </div>
      </div>

      <div className="absolute w-[66px] h-[61px] top-[280px] left-[1012px] shadow-[0px_4px_16px_#e6e6ea]">
        <div className="relative w-[62px] h-14 top-px left-px bg-[url(/img/rectangle-962-5.svg)] bg-[100%_100%]">
          <div className="h-[13px] top-[19px] left-[11px] rotate-[4.00deg] text-lg leading-[18px] absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
            🔥🤓
          </div>
        </div>
      </div>

      <div className="absolute w-16 h-16 top-[920px] left-40 shadow-[0px_4px_16px_#e6e6ea]">
        <div
          className={`relative w-[54px] h-[58px] top-[5px] left-px bg-[url(/img/rectangle-962-6.svg)] bg-[100%_100%] ${overlapClassName}`}
        >
          <div className="h-3.5 top-[25px] left-[17px] rotate-[-8.00deg] text-xl leading-[18px] absolute [font-family:'Poppins',Helvetica] font-normal text-black tracking-[0] whitespace-nowrap">
            😍
          </div>
        </div>
      </div>

      <RecenzieDesktop
        className="!absolute !left-40 !top-[488px]"
        kartaRecenzieIcon={recenzieDesktopKartaRecenzieIcon1}
        kartaRecenzieIcon1={recenzieDesktopKartaRecenzieIcon}
        kartaRecenzieIcon2={
          <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
        }
        kartaRecenzieMobilFrameClassName={
          recenzieDesktopKartaRecenzieMobilFrameClassNameOverride
        }
        kartaRecenzieMobilFrameClassNameOverride={
          recenzieDesktopKartaRecenzieMobilFrameClassName
        }
        kartaRecenzieMobilIcon={recenzieDesktopKartaRecenzieMobilIcon1}
        kartaRecenzieMobilIcon1={override}
        kartaRecenzieMobilIcon2={
          <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />
        }
        override={recenzieDesktopKartaRecenzieMobilIcon}
      />
    </div>
  );
};

Recenzie.propTypes = {
  type: PropTypes.oneOf(["a"]),
};
