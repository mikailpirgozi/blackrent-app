"use client";

import React, { useState, useRef, useCallback } from "react";

interface Props {
  min: number;
  max: number;
  step?: number;
  minValue?: number;
  maxValue?: number;
  onChange?: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
}

export const InteractiveRangeSlider = ({
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onChange,
  formatValue = (value) => value.toString(),
  className = "",
  label,
  minLabel,
  maxLabel,
}: Props): JSX.Element => {
  const [minVal, setMinVal] = useState(minValue ?? min);
  const [maxVal, setMaxVal] = useState(maxValue ?? max);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  const handleMouseDown = (type: 'min' | 'max') => (event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      const value = Math.round((percent / 100) * (max - min) + min);

      if (isDragging === 'min') {
        const newMinVal = Math.min(value, maxVal - step);
        setMinVal(newMinVal);
        onChange?.(newMinVal, maxVal);
      } else {
        const newMaxVal = Math.max(value, minVal + step);
        setMaxVal(newMaxVal);
        onChange?.(minVal, newMaxVal);
      }
    },
    [isDragging, min, max, step, minVal, maxVal, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  return (
    <div className={`flex flex-col items-start pt-2 pb-6 px-0 relative w-full bg-colors-black-600 rounded-lg ${className}`}>
      {label && (
        <div className="h-10 px-4 py-2 flex items-center gap-2 relative w-full">
          <div className="relative w-fit [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
            {label}
          </div>
        </div>
      )}

      <div className="relative w-full h-10">
        <div className="absolute w-[calc(100%-32px)] h-5 top-0.5 left-4" ref={sliderRef}>
          {/* Track */}
          <div className="absolute w-full h-1 top-2 left-0 bg-colors-ligh-gray-800 rounded-full" />
          
          {/* Active range */}
          <div
            className="absolute h-1 top-2 bg-colors-light-yellow-accent-100 rounded-full transition-all duration-150"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Min handle */}
          <div
            className={`absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-full border-2 border-solid border-colors-black-600 cursor-pointer transition-all duration-150 hover:scale-110 ${
              isDragging === 'min' ? 'scale-110 shadow-lg' : ''
            }`}
            style={{ left: `calc(${minPercent}% - 10px)` }}
            onMouseDown={handleMouseDown('min')}
          />

          {/* Max handle */}
          <div
            className={`absolute w-5 h-5 top-0 bg-colors-light-yellow-accent-100 rounded-full border-2 border-solid border-colors-black-600 cursor-pointer transition-all duration-150 hover:scale-110 ${
              isDragging === 'max' ? 'scale-110 shadow-lg' : ''
            }`}
            style={{ left: `calc(${maxPercent}% - 10px)` }}
            onMouseDown={handleMouseDown('max')}
          />
        </div>

        {/* Value labels */}
        <div className="absolute h-2 top-[31px] left-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-6 whitespace-nowrap">
          {minLabel || formatValue(minVal)}
        </div>
        <div className="absolute h-2 top-[31px] right-4 [font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
          {maxLabel || formatValue(maxVal)}
        </div>
      </div>
    </div>
  );
};
