/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  typ: "arrow-top-right";
  className: any;
  typArrowTopRight?: string;
}

export const TypArrowTopRightWrapper = ({
  typ,
  className,
  typArrowTopRight = "/assets/misc/typ-arrow-top-right.png",
}: Props): JSX.Element => {
  return (
    <img
      className={`absolute w-8 h-8 top-0 left-0 ${className}`}
      alt="Typ arrow top right"
      src={typArrowTopRight}
    />
  );
};
