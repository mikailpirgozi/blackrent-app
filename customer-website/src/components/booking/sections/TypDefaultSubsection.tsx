import React, { useState } from "react";

interface TypDefaultSubsectionProps {
  onPromoCodeClick?: () => void;
  onInfoClick?: () => void;
  onFormFilled?: () => void;
}

export const TypDefaultSubsection: React.FC<TypDefaultSubsectionProps> = ({
  onPromoCodeClick,
  onInfoClick,
  onFormFilled,
}) => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedReturnLocation, setSelectedReturnLocation] = useState("");
  const [selectedPickupDate, setSelectedPickupDate] = useState("");
  const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedReturnTime, setSelectedReturnTime] = useState("");
  const [selectedTravelZone, setSelectedTravelZone] = useState("basic");

  const formFields = [
    {
      label: "Miesto vyzdvihnutia",
      value: selectedLocation,
      setter: setSelectedLocation,
    },
    {
      label: "Miesto vrátenia",
      value: selectedReturnLocation,
      setter: setSelectedReturnLocation,
    },
    {
      label: "Deň vyzdvihnutia",
      value: selectedPickupDate,
      setter: setSelectedPickupDate,
    },
    {
      label: "Deň vrátenia",
      value: selectedReturnDate,
      setter: setSelectedReturnDate,
    },
    {
      label: "Čas vyzdvihnutia",
      value: selectedPickupTime,
      setter: setSelectedPickupTime,
    },
    {
      label: "Čas vrátenia",
      value: selectedReturnTime,
      setter: setSelectedReturnTime,
    },
  ];

  const pricingItems = [
    { label: "Počet povolených km", value: "" },
    { label: "Cena prenájmu", value: "" },
    { label: "Poistenie", sublabel: "(základné)", value: "" },
  ];

  const travelZones = [
    {
      id: "basic",
      label: "Slovensko, Česko, Rakúsko",
      selected: true,
      icon: "radio-selected",
    },
    {
      id: "extended",
      label: "+Poľsko, Nemecko, Maďarsko",
      sublabel: "(+30% depozit)",
      selected: false,
      icon: "checkbox",
    },
    {
      id: "eu",
      label: "Celá EU okrem Rumunska",
      sublabel: "(+60% depozit)",
      selected: false,
      icon: "radio-unselected",
    },
    {
      id: "outside-eu",
      label: "Mimo EU",
      sublabel: "(individuálne posúdenie, kontaktujte nás)",
      selected: false,
      icon: "radio-unselected",
    },
  ];

  const handleTravelZoneChange = (zoneId: string) => {
    setSelectedTravelZone(zoneId);
  };

  return (
    <section className="bg-[#1E1E23] flex flex-col w-[328px] sm:w-[536px] md:w-[680px] items-center gap-4 sm:gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 sm:gap-8 px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-3xl overflow-hidden">
        <header className="relative w-[206px] h-4 mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </header>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {formFields.map((field, index) => {
              const isFirstRow = index < 2;
              const isSecondRow = index >= 2 && index < 4;
              const isThirdRow = index >= 4;

              if (
                (isFirstRow && index === 0) ||
                (isSecondRow && index === 2) ||
                (isThirdRow && index === 4)
              ) {
                const nextField = formFields[index + 1];
                return (
                  <div
                    key={`row-${Math.floor(index / 2)}`}
                    className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]"
                  >
                    <button
                      onClick={() => {
                        // Simuluj vyplnenie formulára
                        if (field.label.includes("Miesto")) {
                          field.setter(field.label.includes("vyzdvihnutia") ? "Trenčín" : "Bratislava");
                        } else if (field.label.includes("Dátum")) {
                          field.setter(field.label.includes("vyzdvihnutia") ? "8. 11. 2023" : "10. 11. 2023");
                        } else if (field.label.includes("Čas")) {
                          field.setter(field.label.includes("vyzdvihnutia") ? "14:00" : "18:00");
                        }
                        // Po vyplnení všetkých polí prejdi na ďalší stav
                        setTimeout(() => onFormFilled?.(), 500);
                      }}
                      className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg hover:bg-[#28282D] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <label className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap cursor-pointer">
                          {field.value || field.label}
                        </label>
                      </div>
                      <img
                        className="relative w-5 h-5"
                        alt="Dropdown icon"
                        src="/assets/icon-16-px-28.svg"
                      />
                    </button>

                    <button
                      onClick={() => {
                        // Simuluj vyplnenie formulára pre druhé pole
                        if (nextField.label.includes("Miesto")) {
                          nextField.setter(nextField.label.includes("vyzdvihnutia") ? "Trenčín" : "Bratislava");
                        } else if (nextField.label.includes("Dátum")) {
                          nextField.setter(nextField.label.includes("vyzdvihnutia") ? "8. 11. 2023" : "10. 11. 2023");
                        } else if (nextField.label.includes("Čas")) {
                          nextField.setter(nextField.label.includes("vyzdvihnutia") ? "14:00" : "18:00");
                        }
                        // Po vyplnení všetkých polí prejdi na ďalší stav
                        setTimeout(() => onFormFilled?.(), 500);
                      }}
                      className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg hover:bg-[#28282D] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <label className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap cursor-pointer">
                          {nextField.value || nextField.label}
                        </label>
                      </div>
                      <img
                        className="relative w-5 h-5"
                        alt="Dropdown icon"
                        src="/assets/icon-16-px-28.svg"
                      />
                    </button>
                  </div>
                );
              }
              return null;
            })}
          </div>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {pricingItems.map((item, index) => (
                <div
                  key={index}
                  className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full"
                >
                  <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                    {item.sublabel ? (
                      <p className="font-normal relative w-fit mt-[-1.00px] font-sf-pro text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                        <span className="font-semibold">{item.label} </span>
                        <span className="font-sf-pro font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                          {item.sublabel}
                        </span>
                      </p>
                    ) : (
                      <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}

                    <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onPromoCodeClick}
              className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-[#1E1E23] rounded-lg cursor-pointer hover:bg-[#28282D] transition-colors"
            >
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="/assets/icon-16-px-51.svg"
                />

                <div className="flex-1 grow flex items-center justify-between relative">
                  <label className="relative w-fit mt-[-0.50px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </label>

                  <div className="w-fit mt-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-[#3CEB82] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </button>

            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <div className="h-8 px-4 py-0 flex items-center justify-between relative self-stretch w-full">
                <div className="flex items-center gap-2 relative flex-1 grow">
                  <p className="relative w-fit font-sf-pro font-normal text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                    <span className="font-semibold">Depozit</span>
                    <span className="font-sf-pro font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                      {" "}
                      (vratná záloha)
                    </span>
                  </p>

                  <button
                    onClick={onInfoClick}
                    className="relative w-4 h-4 cursor-pointer"
                  >
                    <img
                      className="relative w-4 h-4"
                      alt="Info icon"
                      src="/assets/icon-16-px-7.svg"
                    />
                  </button>
                </div>

                <div className="w-fit mr-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              {travelZones.map((zone, index) => (
                <div
                  key={zone.id}
                  className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full"
                >
                  <div className="flex items-center gap-1.5 relative flex-1 grow">
                    {zone.icon === "radio-selected" ? (
                      <div className="relative w-6 h-6">
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-[#3C4804] rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                        </div>
                      </div>
                    ) : zone.icon === "checkbox" ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Checkbox"
                        src="/assets/check-boxy-24-5.svg"
                      />
                    ) : (
                      <button
                        onClick={() => handleTravelZoneChange(zone.id)}
                        className="relative w-6 h-6 cursor-pointer"
                      >
                        <div className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-[#646469]" />
                      </button>
                    )}

                    <p className="relative flex-1 font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6">
                      <span className="font-medium">
                        {zone.label}
                        {zone.sublabel ? " " : ""}
                      </span>
                      {zone.sublabel && (
                        <span className="font-sf-pro font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                          {zone.sublabel}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
