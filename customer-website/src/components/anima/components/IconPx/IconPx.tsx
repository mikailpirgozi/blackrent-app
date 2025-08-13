/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  typ: "arrow-right_1" | "arrow-top" | "arrow-down" | "cancel" | "arrow-right";
  className: any;
  typCancel?: string;
  typArrowDown?: string;
  typArrowRight?: string;
  img?: string;
  typArrowTop?: string;
}

export const IconPx = ({
  typ,
  className,
  typCancel = "https://c.animaapp.com/h23eak6p/img/typ-cancel.svg",
  typArrowDown = "https://c.animaapp.com/h23eak6p/img/typ-arrow-down.svg",
  typArrowRight = "https://c.animaapp.com/h23eak6p/img/typ-arrow-right.svg",
  img = "https://c.animaapp.com/h23eak6p/img/typ-arrow-right-1.svg",
  typArrowTop = "https://c.animaapp.com/h23eak6p/img/typ-arrow-top.svg",
}: Props): JSX.Element => {
  return (
    <img
      className={`left-0 top-0 absolute ${typ === "arrow-down" ? "w-5" : "w-4"} ${typ === "arrow-down" ? "h-5" : "h-4"} ${className}`}
      alt="Typ cancel"
      src={
        typ === "arrow-top"
          ? typArrowTop
          : typ === "arrow-down"
            ? typArrowDown
            : typ === "arrow-right"
              ? typArrowRight
              : typ === "arrow-right_1"
                ? img
                : typCancel
      }
    />
  );
};
