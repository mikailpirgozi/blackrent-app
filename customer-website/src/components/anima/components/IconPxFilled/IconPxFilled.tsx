/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

import React from "react";

interface Props {
  type: "star-small" | "star-small-half" | "arrow-small-down";
  className: any;
  typeStarSmall?: string;
  typeStarSmallHalf?: string;
  typeArrowSmall?: string;
}

export const IconPxFilled = ({
  type,
  className,
  typeStarSmall = "/assets/misc/type-star-small.svg",
  typeStarSmallHalf = "/assets/misc/type-star-small-half.svg",
  typeArrowSmall = "/assets/misc/type-arrow-small-down.svg",
}: Props): JSX.Element => {
  return (
    <img
      className={`left-0 top-0 absolute ${type === "arrow-small-down" ? "w-6" : "w-4"} ${type === "arrow-small-down" ? "h-6" : "h-4"} ${className}`}
      alt="Type arrow small"
      src={
        type === "star-small"
          ? typeStarSmall
          : type === "star-small-half"
            ? typeStarSmallHalf
            : typeArrowSmall
      }
    />
  );
};
