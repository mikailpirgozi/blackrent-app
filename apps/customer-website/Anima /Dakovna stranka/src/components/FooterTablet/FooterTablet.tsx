/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { ConcreteComponentNode } from "../ConcreteComponentNode";
import { PropertyDefaultWrapper } from "../PropertyDefaultWrapper";

interface Props {
  type: "c";
  className: any;
}

export const FooterTablet = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`inline-flex flex-col items-start gap-12 relative ${className}`}
    >
      <div className="inline-flex flex-col items-start relative flex-[0_0_auto]">
        <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
          <PropertyDefaultWrapper
            className="!flex-[0_0_auto]"
            property1="default"
          />
        </div>

        <ConcreteComponentNode property1="default" />
      </div>
    </div>
  );
};

FooterTablet.propTypes = {
  type: PropTypes.oneOf(["c"]),
};
