/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import PropTypes from "prop-types";
import React from "react";

interface Props {
  type: "variant-1";
  className: any;
}

export const Pattern = ({ type, className }: Props): JSX.Element => {
  return (
    <div
      className={`relative w-[480px] h-[989px] bg-[url(/img/group.png)] bg-[100%_100%] ${className}`}
    />
  );
};

Pattern.propTypes = {
  type: PropTypes.oneOf(["variant-1"]),
};
