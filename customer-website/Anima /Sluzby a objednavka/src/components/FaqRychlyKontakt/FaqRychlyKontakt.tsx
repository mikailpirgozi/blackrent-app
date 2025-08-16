/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { ConcreteComponentNode } from "../ConcreteComponentNode";
import { Footer } from "../Footer";

interface Props {
  type: "c";
  className: any;
}

export const FaqRychlyKontakt = ({ type, className }: Props): JSX.Element => {
  return (
    <div className={`inline-flex flex-col items-center relative ${className}`}>
      <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
        <Footer className="!relative" />
        <ConcreteComponentNode property1="default" />
      </div>
    </div>
  );
};

FaqRychlyKontakt.propTypes = {
  type: PropTypes.oneOf(["c"]),
};
