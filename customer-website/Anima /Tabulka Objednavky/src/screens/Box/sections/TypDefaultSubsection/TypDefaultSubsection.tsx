import React, { useState } from "react";

export const TypDefaultSubsection = (): JSX.Element => {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedReturnLocation, setSelectedReturnLocation] = useState("");
  const [selectedPickupDate, setSelectedPickupDate] = useState("");
  const [selectedReturnDate, setSelectedReturnDate] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [selectedReturnTime, setSelectedReturnTime] = useState("");
  const [promoCode, setPromoCode] = useState("");
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
    <section className="bg-colors-black-600 flex flex-col w-[536px] items-center gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
        <header className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
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
                    className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]"
                  >
                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {field.label}
                        </label>
                      </div>
                      <img
                        className="relative w-5 h-5"
                        alt="Dropdown icon"
                        src="/img/icon-16-px-28.svg"
                      />
                    </div>

                    <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg">
                      <div className="flex items-center gap-1 relative flex-1 grow">
                        <label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                          {nextField.label}
                        </label>
                      </div>
                      <img
                        className="relative w-5 h-5"
                        alt="Dropdown icon"
                        src="/img/icon-16-px-28.svg"
                      />
                    </div>
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
                      <p className="font-normal relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        <span className="font-semibold">{item.label} </span>
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                          {item.sublabel}
                        </span>
                      </p>
                    ) : (
                      <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                        {item.label}
                      </div>
                    )}

                    <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-colors-black-600 rounded-lg">
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="/img/icon-16-px-51.svg"
                />

                <div className="flex-1 grow flex items-center justify-between relative">
                  <label className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </label>

                  <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-green-accent-500 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <div className="h-8 px-4 py-0 flex items-center justify-between relative self-stretch w-full">
                <div className="flex items-center gap-2 relative flex-1 grow">
                  <p className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    <span className="font-semibold">Depozit</span>
                    <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                      {" "}
                      (vratná záloha)
                    </span>
                  </p>

                  <img
                    className="relative w-4 h-4"
                    alt="Info icon"
                    src="/img/icon-16-px-7.svg"
                  />
                </div>

                <div className="w-fit mr-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
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
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-colors-dark-yellow-accent-300 rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                        </div>
                      </div>
                    ) : zone.icon === "checkbox" ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Checkbox"
                        src="/img/check-boxy-24-5.svg"
                      />
                    ) : (
                      <div className="relative w-6 h-6">
                        <div className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-colors-dark-gray-900" />
                      </div>
                    )}

                    <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                      <span className="font-medium">
                        {zone.label}
                        {zone.sublabel ? " " : ""}
                      </span>
                      {zone.sublabel && (
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
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
