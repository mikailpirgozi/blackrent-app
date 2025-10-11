/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";
import { Icon16Px } from "../../icons/Icon16Px";

interface Props {
  type: "check-selected";
  className: any;
}

export const ElementIconsDarkSmall = ({
  type,
  className,
}: Props): JSX.Element => {
  return (
    <div
      className={`relative w-10 h-10 bg-[url(/img/ellipse-2.svg)] bg-[100%_100%] ${className}`}
    >
      <Icon16Px
        className="!absolute !w-4 !h-4 !top-3 !left-3"
        color="#E4FF56"
      />
    </div>
  );
};

ElementIconsDarkSmall.propTypes = {
  type: PropTypes.oneOf(["check-selected"]),
};
