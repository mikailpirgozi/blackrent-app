/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px69 } from "../../icons/Icon24Px69";

interface Props {
  property1: "type-6";
}

export const NavigationButtons = ({ property1 }: Props): JSX.Element => {
  return (
    <div className="flex w-10 h-10 items-center justify-center gap-2 p-2 relative rounded-xl">
      <Icon24Px69 className="!relative !w-6 !h-6" color="#BEBEC3" />
    </div>
  );
};

NavigationButtons.propTypes = {
  property1: PropTypes.oneOf(["type-6"]),
};
