/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px34 } from "../../icons/Icon16Px34";
import { Icon32Px30 } from "../../icons/Icon32Px30";

interface Props {
  type: "mobile";
  frameClassName: any;
  divClassName: any;
  divClassNameOverride: any;
  text: string;
  className: any;
  frameClassNameOverride: any;
  text1: string;
  icon: JSX.Element;
}

export const KartaRecenzieMobil = ({
  type,
  frameClassName,
  divClassName,
  divClassNameOverride,
  text = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  className,
  frameClassNameOverride,
  text1 = "Lucia Dubecká",
  icon = <Icon16Px34 className="!relative !w-4 !h-4" color="#D7FF14" />,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex flex-col w-[296px] h-[360px] items-end justify-between pt-4 pb-6 px-4 relative rounded-3xl overflow-hidden shadow-[0px_32px_64px_#05050a33,0px_16px_32px_#05050a1a] bg-[url(/img/type-hover.png)] bg-cover bg-[50%_50%] ${className}`}
    >
      <Icon32Px30 className="!relative !w-8 !h-8" />
      <div
        className={`flex flex-col items-start justify-end gap-2 pl-2 pr-0 py-0 relative flex-1 self-stretch w-full grow ${frameClassNameOverride}`}
      >
        {icon}
        <div
          className={`inline-flex flex-col items-start justify-end gap-6 relative flex-[0_0_auto] mr-[-5.00px] ${frameClassName}`}
        >
          <div
            className={`relative w-[261px] mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-1000 text-base tracking-[0] leading-6 ${divClassName}`}
          >
            {text1}
          </div>

          <p
            className={`relative w-[261px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-1000 text-sm tracking-[0] leading-5 ${divClassNameOverride}`}
          >
            {text}
          </p>
        </div>
      </div>
    </div>
  );
};

KartaRecenzieMobil.propTypes = {
  type: PropTypes.oneOf(["mobile"]),
  text: PropTypes.string,
  text1: PropTypes.string,
};
