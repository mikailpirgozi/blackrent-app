/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon24Px16 } from "../../icons/Icon24Px16";

interface Props {
  type: "arrow-right-button-default";
}

export const TypeArrowRightWrapper = ({ type }: Props): JSX.Element => {
  return (
    <div className="flex w-8 h-8 items-center justify-center gap-2 p-2 relative rounded-lg">
      <Icon24Px16 className="!relative !w-6 !h-6 !mt-[-4.00px] !mb-[-4.00px] !ml-[-4.00px] !mr-[-4.00px]" />
    </div>
  );
};

TypeArrowRightWrapper.propTypes = {
  type: PropTypes.oneOf(["arrow-right-button-default"]),
};
