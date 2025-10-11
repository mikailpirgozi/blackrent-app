/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px64 } from "../../icons/Icon16Px64";
import { Icon24Px14 } from "../../icons/Icon24Px14";
import { LogaAutopoIOvni } from "../LogaAutopoIOvni";

interface Props {
  type: "blackrent";
  className: any;
  union: string;
}

export const PoskytovateVozidla = ({
  type,
  className,
  union = "/img/union-2.svg",
}: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex items-center justify-center gap-2 relative ${className}`}
    >
      <div className="inline-flex items-center justify-center gap-1.5 relative flex-[0_0_auto]">
        <LogaAutopoIOvni
          className="!flex-[0_0_auto]"
          type="blackrent-logo-20"
        />
        <Icon16Px64 className="!relative !w-4 !h-4" color="#BEBEC3" />
      </div>

      <img
        className="relative w-px h-[25px] object-cover"
        alt="Line"
        src="/img/line-3.svg"
      />

      <div className="inline-flex items-center justify-center gap-1 relative flex-[0_0_auto]">
        <div className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-lg">
          <Icon24Px14 className="!relative !w-6 !h-6" />
        </div>

        <div className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-lg">
          <div className="relative w-6 h-6">
            <img
              className="absolute w-[22px] h-5 top-0.5 left-px"
              alt="Union"
              src={union}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

PoskytovateVozidla.propTypes = {
  type: PropTypes.oneOf(["blackrent"]),
  union: PropTypes.string,
};
