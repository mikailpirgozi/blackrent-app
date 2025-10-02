/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px6 } from "../../icons/Icon16Px6";

interface Props {
  type: "arrow-right-button-default";
}

export const NavigationButtons = ({ type }: Props): JSX.Element => {
  return (
    <div className="flex w-6 h-6 items-center justify-center gap-2 p-2 relative rounded">
      <Icon16Px6
        className="!relative !w-4 !h-4 !mt-[-4.00px] !mb-[-4.00px] !ml-[-4.00px] !mr-[-4.00px]"
        color="#BEBEC3"
      />
    </div>
  );
};

NavigationButtons.propTypes = {
  type: PropTypes.oneOf(["arrow-right-button-default"]),
};
