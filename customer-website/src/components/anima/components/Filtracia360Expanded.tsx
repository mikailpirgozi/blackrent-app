"use client";

import React, { useState } from "react";

interface FilterState {
  location: string;
  pickupDate: string;
  returnDate: string;
  daysCount: number;
  pricePerDay: [number, number];
  company: string;
  brand: string;
  bodyType: string;
  yearRange: [number, number];
  fuel: string;
  transmission: string;
  drive: string;
  equipment: string[];
}

interface Filtracia360ExpandedProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: FilterState) => void;
  onFilterChange?: (filters: FilterState) => void;
}

export const Filtracia360Expanded: React.FC<Filtracia360ExpandedProps> = ({
  isOpen,
  onClose,
  onSearch,
  onFilterChange
}) => {
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    pickupDate: "",
    returnDate: "",
    daysCount: 31,
    pricePerDay: [30, 400],
    company: "",
    brand: "",
    bodyType: "",
    yearRange: [2003, 2024],
    fuel: "",
    transmission: "",
    drive: "",
    equipment: []
  });

  const [showMoreEquipment, setShowMoreEquipment] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});

  const equipmentOptions = [
    "Bluetooth", "USB vstup", "Klimatizácia", "Apple carplay", 
    "GPS", "Tempomat", "4×4", "Parkovacie senzory",
    "Kamera", "Keyless", "Heated seats", "Sunroof"
  ];

  const locationOptions = ["Bratislava", "Košice", "Prešov", "Žilina", "Banská Bystrica", "Nitra", "Trnava", "Trenčín"];
  const companyOptions = ["AutoRent SK", "CarShare Plus", "RentCar Pro", "Slovak Rental", "EuroRent", "CityDrive"];
  const brandOptions = ["Audi", "BMW", "Mercedes", "Volkswagen", "Škoda", "Toyota", "Honda", "Ford"];
  const bodyTypeOptions = ["Sedan", "Hatchback", "SUV", "Kombi", "Kupé", "Kabriolet"];
  const fuelOptions = ["Benzín", "Diesel", "Hybrid", "Elektro", "CNG", "LPG"];
  const transmissionOptions = ["Manuálna", "Automatická", "CVT"];
  const driveOptions = ["Predný pohon", "Zadný pohon", "4x4", "AWD"];

  const visibleEquipment = showMoreEquipment ? equipmentOptions : equipmentOptions.slice(0, 8);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const toggleEquipment = (equipment: string) => {
    const newEquipment = filters.equipment.includes(equipment)
      ? filters.equipment.filter(e => e !== equipment)
      : [...filters.equipment, equipment];
    handleFilterChange('equipment', newEquipment);
  };

  const toggleDropdown = (dropdownKey: string) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownKey]: !prev[dropdownKey]
    }));
  };

  const selectOption = (key: keyof FilterState, value: string, dropdownKey: string) => {
    handleFilterChange(key, value);
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownKey]: false
    }));
  };

  const DropdownField = ({ 
    value, 
    placeholder, 
    options, 
    dropdownKey, 
    filterKey 
  }: {
    value: string;
    placeholder: string;
    options: string[];
    dropdownKey: string;
    filterKey: keyof FilterState;
  }) => {
    const isOpen = openDropdowns[dropdownKey];
    
    return (
      <div className="relative">
        <button
          onClick={() => toggleDropdown(dropdownKey)}
          className="flex items-center gap-0.5 px-4 py-3 w-full bg-[#1E1E23] rounded-lg border border-transparent hover:border-[#28282D] transition-colors"
        >
          <div className="flex items-center gap-1 flex-1">
            <span className="font-['Poppins'] font-medium text-sm text-[#BEBEC3] text-left">
              {value || placeholder}
            </span>
          </div>
          <div className="w-4 h-4">
            <svg 
              width="12" 
              height="7" 
              viewBox="0 0 12 7" 
              fill="none" 
              className={`mt-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <path d="M1 1L6 6L11 1" stroke="#D7FF14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] border border-[#28282D] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => selectOption(filterKey, option, dropdownKey)}
                className="w-full px-4 py-3 text-left font-['Poppins'] font-medium text-sm text-[#BEBEC3] hover:bg-[#28282D] hover:text-[#F0F0F5] transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const RangeSlider = ({ 
    label, 
    min, 
    max, 
    value, 
    onChange, 
    formatValue 
  }: {
    label: string;
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    formatValue?: (value: number) => string;
  }) => {
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

    const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(type);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newValue = min + (max - min) * percentage;
      
      if (isDragging === 'min') {
        onChange([Math.min(newValue, value[1]), value[1]]);
      } else {
        onChange([value[0], Math.max(newValue, value[0])]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    const minPercentage = ((value[0] - min) / (max - min)) * 100;
    const maxPercentage = ((value[1] - min) / (max - min)) * 100;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="font-['Poppins'] font-medium text-sm text-[#F0F0F5]">{label}</span>
        </div>
        <div 
          className="relative h-10 px-4 cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <span className="absolute top-8 left-4 font-['Poppins'] font-normal text-xs text-[#BEBEC3]">
            {formatValue ? formatValue(value[0]) : value[0]}
          </span>
          <span className="absolute top-8 right-4 font-['Poppins'] font-normal text-xs text-[#BEBEC3]">
            {formatValue ? formatValue(value[1]) : value[1]}
          </span>
          
          {/* Track - adjusted for mobile width */}
          <div className="absolute top-3 left-[18px] w-[252px] h-1 bg-[#505E06] rounded-full"></div>
          
          {/* Active range */}
          <div 
            className="absolute top-3 h-1 bg-[#505E06] rounded-full"
            style={{
              left: `${18 + (minPercentage * 252) / 100}px`,
              right: `${18 + ((100 - maxPercentage) * 252) / 100}px`
            }}
          ></div>
          
          {/* Min handle */}
          <div 
            className="absolute top-0.5 w-5 h-5 bg-[#D7FF14] border-2 border-[#1E1E23] rounded-full cursor-pointer hover:scale-110 transition-transform"
            style={{ left: `${8 + (minPercentage * 252) / 100}px` }}
            onMouseDown={handleMouseDown('min')}
          ></div>
          
          {/* Max handle */}
          <div 
            className="absolute top-0.5 w-5 h-5 bg-[#D7FF14] border-2 border-[#1E1E23] rounded-full cursor-pointer hover:scale-110 transition-transform"
            style={{ left: `${8 + (maxPercentage * 252) / 100}px` }}
            onMouseDown={handleMouseDown('max')}
          ></div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="w-[328px] bg-[#141419] rounded-2xl overflow-hidden px-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2 px-6 py-4 bg-[#1E1E23] rounded-t-2xl border-b border-[#28282D] w-[328px] h-[72px] relative -mx-4">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 relative">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="absolute top-0.5 left-0.5">
              <path d="M8.33333 15H11.6667V13.3333H8.33333V15ZM2.5 5V6.66667H17.5V5H2.5ZM5 10.8333H15V9.16667H5V10.8333Z" fill="#E4FF56"/>
            </svg>
          </div>
          <span className="font-['Poppins'] font-medium text-base text-[#F0F0F5]">Filtrácia</span>
        </div>
        <button 
          onClick={onClose}
          className="absolute right-6 w-4 h-4 flex items-center justify-center"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8.33333 1.66667L1.66667 8.33333M1.66667 1.66667L8.33333 8.33333" stroke="#D7FF14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-6 py-6">
        
        {/* Dostupnosť */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Dostupnosť</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Miesto vyzdvihnutia - highlighted */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('location')}
                className="flex items-center gap-0.5 px-4 py-3 w-full bg-[#28282D] rounded-lg border border-transparent hover:border-[#28282D] transition-colors"
              >
                <div className="flex items-center gap-1 flex-1">
                  <span className="font-['Poppins'] font-medium text-sm text-[#BEBEC3] text-left">
                    {filters.location || "Miesto vyzdvihnutia:"}
                  </span>
                </div>
                <div className="w-4 h-4">
                  <svg 
                    width="12" 
                    height="7" 
                    viewBox="0 0 12 7" 
                    fill="none" 
                    className={`mt-1 transition-transform ${openDropdowns['location'] ? 'rotate-180' : ''}`}
                  >
                    <path d="M1 1L6 6L11 1" stroke="#D7FF14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              
              {openDropdowns['location'] && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E1E23] border border-[#28282D] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {locationOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => selectOption('location', option, 'location')}
                      className="w-full px-4 py-3 text-left font-['Poppins'] font-medium text-sm text-[#BEBEC3] hover:bg-[#28282D] hover:text-[#F0F0F5] transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Deň vyzdvihnutia */}
            <DropdownField
              value={filters.pickupDate}
              placeholder="Deň vyzdvihnutia:"
              options={["Dnes", "Zajtra", "Tento týždeň", "Budúci týždeň", "Vlastný dátum"]}
              dropdownKey="pickupDate"
              filterKey="pickupDate"
            />

            {/* Deň vrátenia */}
            <DropdownField
              value={filters.returnDate}
              placeholder="Deň vrátenia:"
              options={["Za 1 deň", "Za 2 dni", "Za týždeň", "Za mesiac", "Vlastný dátum"]}
              dropdownKey="returnDate"
              filterKey="returnDate"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#28282D]"></div>

        {/* Cena */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Cena</h3>
          </div>
          
          <div className="flex flex-col gap-6 px-0 pb-6 bg-[#1E1E23] rounded-lg">
            {/* Počet dní - single value slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="font-['Poppins'] font-medium text-sm text-[#F0F0F5]">Počet dní</span>
              </div>
              <div className="relative h-10 px-4">
                <div className="absolute top-3 left-[18px] w-[252px] h-1 bg-[#505E06] rounded-full"></div>
                <div 
                  className="absolute top-0.5 w-5 h-5 bg-[#D7FF14] border-2 border-[#1E1E23] rounded-full cursor-pointer hover:scale-110 transition-transform"
                  style={{ left: '260px' }}
                ></div>
                <span className="absolute top-8 right-0 w-5 h-2 font-['Poppins'] font-normal text-xs text-right text-[#BEBEC3]">
                  {filters.daysCount}+
                </span>
              </div>
            </div>

            {/* Cena/1deň */}
            <RangeSlider
              label="Cena/1deň"
              min={30}
              max={400}
              value={filters.pricePerDay}
              onChange={(value) => handleFilterChange('pricePerDay', value)}
              formatValue={(value) => `${Math.round(value)}€`}
            />
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#28282D]"></div>

        {/* Autopožičovňa */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Autopožičovňa</h3>
          </div>
          
          <DropdownField
            value={filters.company}
            placeholder="Vyberte:"
            options={companyOptions}
            dropdownKey="company"
            filterKey="company"
          />
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#28282D]"></div>

        {/* Značka vozidla */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Značka vozidla</h3>
          </div>
          
          <DropdownField
            value={filters.brand}
            placeholder="Značka:"
            options={brandOptions}
            dropdownKey="brand"
            filterKey="brand"
          />
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#28282D]"></div>

        {/* Parametre vozidla */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Parametre vozidla</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* Karoséria */}
            <DropdownField
              value={filters.bodyType}
              placeholder="Karoséria:"
              options={bodyTypeOptions}
              dropdownKey="bodyType"
              filterKey="bodyType"
            />

            {/* Rok výroby */}
            <div className="flex flex-col gap-6 px-0 pb-6 bg-[#1E1E23] rounded-lg">
              <RangeSlider
                label="Rok výroby"
                min={2003}
                max={2024}
                value={filters.yearRange}
                onChange={(value) => handleFilterChange('yearRange', value)}
                formatValue={(value) => Math.round(value).toString()}
              />
            </div>

            {/* Palivo */}
            <DropdownField
              value={filters.fuel}
              placeholder="Palivo:"
              options={fuelOptions}
              dropdownKey="fuel"
              filterKey="fuel"
            />

            {/* Prevodovka */}
            <DropdownField
              value={filters.transmission}
              placeholder="Prevodovka:"
              options={transmissionOptions}
              dropdownKey="transmission"
              filterKey="transmission"
            />

            {/* Pohon */}
            <DropdownField
              value={filters.drive}
              placeholder="Pohon:"
              options={driveOptions}
              dropdownKey="drive"
              filterKey="drive"
            />
          </div>
        </div>

        {/* Separator */}
        <div className="w-full h-px bg-[#28282D]"></div>

        {/* Výbava */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 py-4">
            <h3 className="font-['Poppins'] font-semibold text-base text-[#F0F0F5]">Výbava</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {visibleEquipment.map((equipment, index) => (
              <button
                key={equipment}
                onClick={() => toggleEquipment(equipment)}
                className={`flex items-center justify-center gap-4 px-4 py-2 h-8 rounded-lg transition-colors ${
                  filters.equipment.includes(equipment)
                    ? 'bg-[#D7FF14] text-[#1E1E23]'
                    : 'bg-[#1E1E23] text-[#BEBEC3] hover:bg-[#28282D]'
                }`}
              >
                <span className="font-['Poppins'] font-normal text-sm">{equipment}</span>
              </button>
            ))}
            
            {!showMoreEquipment && (
              <button
                onClick={() => setShowMoreEquipment(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 h-8 bg-[#1E1E23] rounded-lg hover:bg-[#28282D] transition-colors"
              >
                <span className="font-['Poppins'] font-normal text-sm text-[#D7FF14]">Viac</span>
                <div className="w-4 h-4">
                  <svg width="12" height="7" viewBox="0 0 12 7" fill="none" className="mt-1">
                    <path d="M1 1L6 6L11 1" stroke="#D7FF14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex flex-col justify-end items-center gap-2 px-8 py-6 border-t border-[#28282D] w-[328px] relative -mx-4">
        <button
          onClick={handleSearch}
          className="flex items-center justify-center gap-1.5 px-5 py-2 h-10 bg-[#D7FF14] rounded-[99px] hover:bg-[#E4FF56] transition-colors"
        >
          <span className="font-['Poppins'] font-semibold text-sm text-[#141900]">Vyhľadať</span>
          <div className="w-4 h-4">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M6.41667 12.25C9.59542 12.25 12.1667 9.67875 12.1667 6.5C12.1667 3.32125 9.59542 0.75 6.41667 0.75C3.23792 0.75 0.666672 3.32125 0.666672 6.5C0.666672 9.67875 3.23792 12.25 6.41667 12.25Z" stroke="#141900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.25 13.25L10.0833 10.0833" stroke="#141900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};
