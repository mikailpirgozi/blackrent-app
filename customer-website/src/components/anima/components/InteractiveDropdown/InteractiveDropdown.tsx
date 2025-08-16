"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowIcon } from "../ArrowIcon";

interface DropdownOption {
  value: string;
  label: string;
}

interface Props {
  placeholder: string;
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  iconPxTypArrowDown?: string;
  isActive?: boolean;
}

export const InteractiveDropdown = ({
  placeholder,
  options,
  value,
  onChange,
  className = "",
  iconPxTypArrowDown = "/assets/misc/icon-16-px-32.svg",
  isActive = false,
}: Props): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`flex h-10 items-center gap-0.5 pl-4 pr-3.5 py-3 relative w-full rounded-lg cursor-pointer transition-all duration-200 ${
          isActive || isOpen
            ? "bg-colors-black-800 border border-colors-light-yellow-accent-100"
            : "bg-colors-black-600 hover:bg-colors-black-500"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex h-[18px] items-center gap-1 relative flex-1 grow mt-[-1.00px] mb-[-1.00px]">
          <div
            className={`relative w-fit [font-family:'Poppins',Helvetica] font-medium text-sm tracking-[0] leading-6 whitespace-nowrap transition-colors duration-200 ${
              selectedValue
                ? "text-colors-white-800"
                : "text-colors-ligh-gray-800"
            }`}
          >
            {displayText}
          </div>
        </div>

        <ArrowIcon
          direction={isOpen ? "up" : "down"}
          className="transition-transform duration-200"
          size={16}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-colors-black-600 rounded-lg border border-colors-black-500 shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className="px-4 py-3 hover:bg-colors-black-500 cursor-pointer transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSelect(option.value)}
            >
              <div className="[font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                {option.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
