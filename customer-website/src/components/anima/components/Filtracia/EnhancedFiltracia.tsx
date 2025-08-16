"use client";

import React, { useState } from "react";
import { InteractiveFilterTags } from "../FilterTags/InteractiveFilterTags";
import { InteractiveDropdown } from "../InteractiveDropdown/InteractiveDropdown";
import { InteractiveRangeSlider } from "../InteractiveRangeSlider/InteractiveRangeSlider";
import { TlacitkoNaTmavemWrapper } from "../TlacitkoNaTmavemWrapper";

interface FilterState {
  location: string;
  pickupDate: string;
  returnDate: string;
  rentalCompany: string;
  brand: string;
  bodyType: string;
  fuel: string;
  transmission: string;
  drivetrain: string;
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
  daysRange: { min: number; max: number };
  features: string[];
}

interface Vehicle {
  id: string;
  name: string;
  category: string;
  price: number;
  features: string[];
  available: boolean;
}

interface Props {
  type?: "default";
  className?: string;
  vehicles: Vehicle[];
  onFilterChange?: (filteredVehicles: Vehicle[]) => void;
  onSearch?: (filters: FilterState) => void;
}

const locationOptions = [
  { value: "bratislava", label: "Bratislava" },
  { value: "kosice", label: "Košice" },
  { value: "zilina", label: "Žilina" },
  { value: "presov", label: "Prešov" },
  { value: "banska-bystrica", label: "Banská Bystrica" },
];

const rentalCompanyOptions = [
  { value: "any", label: "Nezáleží" },
  { value: "europcar", label: "Europcar" },
  { value: "hertz", label: "Hertz" },
  { value: "avis", label: "Avis" },
  { value: "budget", label: "Budget" },
];

const brandOptions = [
  { value: "any", label: "Značka" },
  { value: "audi", label: "Audi" },
  { value: "bmw", label: "BMW" },
  { value: "mercedes", label: "Mercedes-Benz" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "skoda", label: "Škoda" },
  { value: "tesla", label: "Tesla" },
];

const bodyTypeOptions = [
  { value: "any", label: "Karoséria" },
  { value: "sedan", label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "suv", label: "SUV" },
  { value: "combi", label: "Combi" },
  { value: "coupe", label: "Coupé" },
];

const fuelOptions = [
  { value: "any", label: "Palivo" },
  { value: "petrol", label: "Benzín" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Elektrický" },
  { value: "hybrid", label: "Hybrid" },
];

const transmissionOptions = [
  { value: "any", label: "Prevodovka" },
  { value: "manual", label: "Manuálna" },
  { value: "automatic", label: "Automatická" },
];

const drivetrainOptions = [
  { value: "any", label: "Pohon" },
  { value: "fwd", label: "Predný" },
  { value: "rwd", label: "Zadný" },
  { value: "awd", label: "Všetky kolesá" },
];

const availableFeatures = [
  "Bluetooth",
  "USB vstup", 
  "Klimatizácia",
  "Apple carplay",
  "GPS",
  "Tempomat",
  "4×4",
  "Parkovacie senzory",
  "Android Auto",
  "Kožené sedadlá",
  "Vyhrievané sedadlá",
  "Panoramatická strecha"
];

export const EnhancedFiltracia = ({
  type = "default",
  className = "",
  vehicles,
  onFilterChange,
  onSearch,
}: Props): JSX.Element => {
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    pickupDate: "",
    returnDate: "",
    rentalCompany: "",
    brand: "",
    bodyType: "",
    fuel: "",
    transmission: "",
    drivetrain: "",
    priceRange: { min: 30, max: 400 },
    yearRange: { min: 2003, max: 2024 },
    daysRange: { min: 1, max: 31 },
    features: [],
  });

  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  
  // Filter vehicles based on current filters
  const filteredVehicles = React.useMemo(() => {
    return (vehicles || []).filter(vehicle => {
      // Search term filter
      if (searchTerm && !vehicle.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== "all" && vehicle.category !== selectedCategory) {
        return false;
      }
      
      // Price range filter
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      if (vehicle.price < min || vehicle.price > max) {
        return false;
      }
      
      // Availability filter
      if (availableOnly && !vehicle.available) {
        return false;
      }
      
      return true;
    });
  }, [vehicles, searchTerm, selectedCategory, minPrice, maxPrice, availableOnly]);
  
  // Notify parent of filtered vehicles whenever filters change
  React.useEffect(() => {
    onFilterChange?.(filteredVehicles);
  }, [filteredVehicles, onFilterChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = filters.features.includes(feature)
      ? filters.features.filter(f => f !== feature)
      : [...filters.features, feature];
    updateFilter('features', newFeatures);
  };

  const handleSearch = () => {
    onSearch?.(filters);
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      location: "",
      pickupDate: "",
      returnDate: "",
      rentalCompany: "",
      brand: "",
      bodyType: "",
      fuel: "",
      transmission: "",
      drivetrain: "",
      priceRange: { min: 30, max: 400 },
      yearRange: { min: 2003, max: 2024 },
      daysRange: { min: 1, max: 31 },
      features: [],
    };
    setFilters(defaultFilters);
    setSearchTerm("");
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setAvailableOnly(false);
    onFilterChange?.(vehicles); // Return all vehicles
  };

  const visibleFeatures = showAllFeatures ? availableFeatures : availableFeatures.slice(0, 8);

  return (
    <div
      role="region"
      aria-label="Filtre"
      className={`flex flex-col w-[308px] items-center gap-6 pt-6 pb-10 px-4 relative bg-colors-black-400 rounded-2xl overflow-hidden ${className}`}
    >
      {/* Dostupnosť Section */}
      <div className="h-4 items-center gap-2 px-2 py-0 flex relative self-stretch w-full">
        <div className="relative w-fit mt-[-1.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Dostupnosť
        </div>
      </div>

      <div className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <InteractiveDropdown
            placeholder="Miesto vyzdvihnutia"
            options={locationOptions}
            value={filters.location}
            onChange={(value) => updateFilter('location', value)}
            className="self-stretch w-full"
            isActive={!!filters.location}
          />

          <InteractiveDropdown
            placeholder="Deň vyzdvihnutia"
            options={[]} // Date picker would be implemented here
            value={filters.pickupDate}
            onChange={(value) => updateFilter('pickupDate', value)}
            className="self-stretch w-full"
            isActive={!!filters.pickupDate}
          />

          <InteractiveDropdown
            placeholder="Deň vrátenia"
            options={[]} // Date picker would be implemented here
            value={filters.returnDate}
            onChange={(value) => updateFilter('returnDate', value)}
            className="self-stretch w-full"
            isActive={!!filters.returnDate}
          />
        </div>
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-14-3.svg"
      />

      {/* Cena Section */}
      <div className="flex h-4 items-center gap-2 px-2 py-0 relative self-stretch w-full">
        <div className="relative w-fit mt-[-1.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Cena
        </div>
      </div>

      <InteractiveRangeSlider
        min={1}
        max={31}
        minValue={filters.daysRange.min}
        maxValue={filters.daysRange.max}
        onChange={(min, max) => updateFilter('daysRange', { min, max })}
        label="Počet dní"
        formatValue={(value) => value === 31 ? "31+" : value.toString()}
        className="self-stretch w-full"
      />

      <InteractiveRangeSlider
        min={30}
        max={400}
        step={10}
        minValue={filters.priceRange.min}
        maxValue={filters.priceRange.max}
        onChange={(min, max) => updateFilter('priceRange', { min, max })}
        label="Cena/1deň"
        formatValue={(value) => `${value}€`}
        className="self-stretch w-full"
      />

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      {/* Autopožičovňa Section */}
      <div className="h-4 pl-2 pr-4 py-4 flex items-center gap-2 relative self-stretch w-full">
        <div className="mt-[-17.50px] mb-[-9.50px] font-semibold text-colors-white-800 text-base relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
          Autopožičovňa
        </div>
      </div>

      <InteractiveDropdown
        placeholder="Autopožičovňa"
        options={rentalCompanyOptions}
        value={filters.rentalCompany}
        onChange={(value) => updateFilter('rentalCompany', value)}
        className="self-stretch w-full"
        isActive={!!filters.rentalCompany}
      />

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      {/* Značka vozidla Section */}
      <div className="flex h-4 pl-2 pr-4 py-4 self-stretch w-full items-center gap-2 relative">
        <div className="relative w-fit mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
          Značka vozidla
        </div>
      </div>

      <InteractiveDropdown
        placeholder="Značka"
        options={brandOptions}
        value={filters.brand}
        onChange={(value) => updateFilter('brand', value)}
        className="self-stretch w-full"
        isActive={!!filters.brand}
      />

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-11-3.svg"
      />

      {/* Parametre vozidla Section */}
      <div className="flex h-4 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full">
        <div className="relative w-[187px] mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
          Parametre vozidla
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
        <InteractiveDropdown
          placeholder="Karoséria"
          options={bodyTypeOptions}
          value={filters.bodyType}
          onChange={(value) => updateFilter('bodyType', value)}
          className="self-stretch w-full"
          isActive={!!filters.bodyType}
        />

        <InteractiveRangeSlider
          min={2003}
          max={2024}
          minValue={filters.yearRange.min}
          maxValue={filters.yearRange.max}
          onChange={(min, max) => updateFilter('yearRange', { min, max })}
          label="Rok výroby"
          className="self-stretch w-full"
        />

        <InteractiveDropdown
          placeholder="Palivo"
          options={fuelOptions}
          value={filters.fuel}
          onChange={(value) => updateFilter('fuel', value)}
          className="self-stretch w-full"
          isActive={!!filters.fuel}
        />

        <InteractiveDropdown
          placeholder="Prevodovka"
          options={transmissionOptions}
          value={filters.transmission}
          onChange={(value) => updateFilter('transmission', value)}
          className="self-stretch w-full"
          isActive={!!filters.transmission}
        />

        <InteractiveDropdown
          placeholder="Pohon"
          options={drivetrainOptions}
          value={filters.drivetrain}
          onChange={(value) => updateFilter('drivetrain', value)}
          className="self-stretch w-full"
          isActive={!!filters.drivetrain}
        />
      </div>

      <img
        className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px] object-cover"
        alt="Line"
        src="/assets/misc/line-14-3.svg"
      />

      {/* Výbava Section */}
      <div className="flex h-4 items-center gap-2 pl-2 pr-4 py-4 relative self-stretch w-full">
        <div className="relative w-[187px] mt-[-17.50px] mb-[-9.50px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6">
          Výbava
        </div>
      </div>

      <div className="flex flex-col items-center gap-10 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-wrap items-start gap-[16px_8px] relative self-stretch w-full flex-[0_0_auto]">
          {visibleFeatures.map((feature) => (
            <InteractiveFilterTags
              key={feature}
              className="!flex-[0_0_auto]"
              text={feature}
              type="default"
              isSelected={filters.features.includes(feature)}
              onToggle={() => toggleFeature(feature)}
            />
          ))}
          
          <InteractiveFilterTags
            className="!flex-[0_0_auto]"
            type="more-default"
            onClick={() => setShowAllFeatures(!showAllFeatures)}
          />
        </div>

        <TlacitkoNaTmavemWrapper
          className="!pl-6 !pr-5 !py-4 transition-all duration-200 hover:scale-105 active:scale-95"
          iconPx="/assets/misc/icon-search-dark-24px.svg"
          iconPxClassName="!mt-[-4.00px] !mb-[-4.00px]"
          text="Vyhľadať"
          tlacitkoNaTmavem="normal"
          onClick={handleSearch}
        />
      </div>
    </div>
  );
};
