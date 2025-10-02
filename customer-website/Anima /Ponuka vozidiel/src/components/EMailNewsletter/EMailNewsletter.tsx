/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px55 } from "../../icons/Icon24Px55";
import { PrimaryButtons } from "../PrimaryButtons";

interface Props {
  type: "default-b";
  className: any;
  divClassName: any;
}

export const EMailNewsletter = ({
  type,
  className,
  divClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[391px] items-center justify-between pl-4 pr-2 py-2 relative bg-colors-black-600 rounded-[99px] overflow-hidden ${className}`}
    >
      <div className="flex items-center gap-2 relative flex-1 grow">
        <Icon24Px55 className="!relative !w-6 !h-6" color="#646469" />
        <div
          className={`relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-dark-gray-900 text-sm tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] ${divClassName}`}
        >
          Váš e-mail
        </div>
      </div>

      <PrimaryButtons
        className="!flex-[0_0_auto]"
        text="Potvrdiť"
        tlacitkoNaTmavemem40="tlacitko-na-tmavemem-403"
      />
    </div>
  );
};

EMailNewsletter.propTypes = {
  type: PropTypes.oneOf(["default-b"]),
};
