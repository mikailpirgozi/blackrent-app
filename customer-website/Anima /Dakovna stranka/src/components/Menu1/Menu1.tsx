/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { BlackrentLogo } from "../BlackrentLogo";
import { SecondaryButtons } from "../SecondaryButtons";
import { SekcieVMenuBlack } from "../SekcieVMenuBlack";
import { Store } from "../Store";

interface Props {
  type: "default";
  className: any;
  sekcieVMenuBlackDivClassName: any;
  sekcieVMenuBlackDivClassNameOverride: any;
  sekcieVMenuBlackDivClassName1: any;
  sekcieVMenuBlackDivClassName2: any;
  storeDivClassName: any;
}

export const Menu1 = ({
  type,
  className,
  sekcieVMenuBlackDivClassName,
  sekcieVMenuBlackDivClassNameOverride,
  sekcieVMenuBlackDivClassName1,
  sekcieVMenuBlackDivClassName2,
  storeDivClassName,
}: Props): JSX.Element => {
  return (
    <div
      className={`flex w-[1728px] h-[88px] items-center justify-between px-8 py-0 relative ${className}`}
    >
      <BlackrentLogo className="!h-8 bg-[url(/img/vector-8.svg)] !relative !w-[214.4px]" />
      <div className="inline-flex items-center justify-center relative flex-[0_0_auto]">
        <div className="inline-flex items-center justify-center gap-2 relative self-stretch flex-[0_0_auto]">
          <SekcieVMenuBlack
            className="!flex-[0_0_auto]"
            divClassName={sekcieVMenuBlackDivClassName}
            text="Ponuka vozidiel"
            type="default"
          />
          <SekcieVMenuBlack
            className="!flex-[0_0_auto]"
            divClassName="!text-colors-ligh-gray-800"
            text="Služby"
            type="default"
          />
          <SekcieVMenuBlack
            className="!flex-[0_0_auto]"
            divClassName={sekcieVMenuBlackDivClassNameOverride}
            text="Store"
            type="default"
          />
          <SekcieVMenuBlack
            className="!flex-[0_0_auto]"
            divClassName={sekcieVMenuBlackDivClassName1}
            text="O nás"
            type="default"
          />
          <SekcieVMenuBlack
            className="!flex-[0_0_auto]"
            divClassName={sekcieVMenuBlackDivClassName2}
            text="Kontakt"
            type="default"
          />
        </div>

        <div className="inline-flex items-center justify-center gap-2 relative flex-[0_0_auto]">
          <Store
            className="!flex-[0_0_auto]"
            divClassName={storeDivClassName}
            state="default"
          />
          <SecondaryButtons
            className="!flex-[0_0_auto]"
            stateProp="secondary"
            text="Prihlásiť sa"
          />
        </div>
      </div>
    </div>
  );
};

Menu1.propTypes = {
  type: PropTypes.oneOf(["default"]),
};
