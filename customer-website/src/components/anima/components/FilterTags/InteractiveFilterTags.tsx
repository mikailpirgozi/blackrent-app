"use client";

import React, { useState } from "react";
import { ArrowIcon } from "../ArrowIcon";

interface Props {
  type: "more-default" | "default";
  className?: string;
  text?: string;
  iconPxTypArrowDown?: string;
  isSelected?: boolean;
  onToggle?: (selected: boolean) => void;
  onClick?: () => void;
}

export const InteractiveFilterTags = ({
  type,
  className = "",
  text = "Bluetooth",
  iconPxTypArrowDown = "https://c.animaapp.com/h23eak6p/img/icon-16-px-32.svg",
  isSelected = false,
  onToggle,
  onClick,
}: Props): JSX.Element => {
  const [internalSelected, setInternalSelected] = useState(isSelected);

  const handleClick = () => {
    if (type === "default") {
      const newSelected = !internalSelected;
      setInternalSelected(newSelected);
      onToggle?.(newSelected);
    } else {
      onClick?.();
    }
  };

  const selectedState = onToggle ? isSelected : internalSelected;

  return (
    <div
      className={`inline-flex items-center px-4 py-2 h-8 rounded-lg justify-center relative cursor-pointer transition-all duration-200 hover:scale-105 ${
        type === "more-default" ? "gap-2" : "gap-4"
      } ${
        selectedState && type === "default"
          ? "bg-colors-light-yellow-accent-100 hover:bg-colors-light-yellow-accent-200"
          : "bg-colors-black-600 hover:bg-colors-black-500"
      } ${className}`}
      onClick={handleClick}
    >
      <div
        className={`[font-family:'Poppins',Helvetica] w-fit tracking-[0] text-sm font-normal leading-6 whitespace-nowrap relative transition-colors duration-200 ${
          type === "default"
            ? selectedState
              ? "text-colors-black-800"
              : "text-colors-ligh-gray-800"
            : "text-colors-light-yellow-accent-100"
        }`}
      >
        {type === "more-default" && <>Viac</>}
        {type === "default" && <>{text}</>}
      </div>

      {type === "more-default" && (
        <ArrowIcon
          direction="down"
          className="transition-transform duration-200 hover:rotate-180"
          size={16}
        />
      )}
    </div>
  );
};
