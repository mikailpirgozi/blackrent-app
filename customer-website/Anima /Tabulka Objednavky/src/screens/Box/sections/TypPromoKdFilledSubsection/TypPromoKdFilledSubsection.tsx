import React, { useState } from "react";

export const TypPromoKdFilledSubsection = (): JSX.Element => {
  const [promoCode, setPromoCode] = useState("0482023");
  const [selectedTravelZone, setSelectedTravelZone] = useState("basic");

  const formFields = [
    { label: "Trenčín", icon: "/img/icon-16-px-50.svg" },
    { label: "Bratislava", icon: "/img/icon-16-px-50.svg" },
  ];

  const dateTimeFields = [
    { label: "8. 11. 2023", icon: "/img/icon-16-px-50.svg" },
    { label: "10. 11. 2023", icon: "/img/icon-16-px-50.svg" },
    { label: "14:00", icon: "/img/icon-16-px-50.svg" },
    { label: "18:00", icon: "/img/icon-16-px-50.svg" },
  ];

  const priceItems = [
    { label: "Počet povolených km", value: "1700 km" },
    { label: "Cena prenájmu", value: "890 €" },
    { label: "Poistenie", sublabel: "(základné)", value: "890 €" },
  ];

  const travelZones = [
    {
      id: "basic",
      label: "Slovensko, Česko, Rakúsko",
      selected: true,
      type: "radio",
    },
    {
      id: "extended",
      label: "+Poľsko, Nemecko, Maďarsko",
      sublabel: "(+30% depozit)",
      selected: false,
      type: "checkbox",
    },
    {
      id: "eu",
      label: "Celá EU okrem Rumunska",
      sublabel: "(+60% depozit)",
      selected: false,
      type: "radio",
    },
    {
      id: "outside-eu",
      label: "Mimo EU",
      sublabel: "(individuálne posúdenie, kontaktujte nás)",
      selected: false,
      type: "radio",
    },
  ];

  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value);
  };

  const handleCancelPromoCode = () => {
    setPromoCode("");
  };

  const handleTravelZoneChange = (zoneId: string) => {
    setSelectedTravelZone(zoneId);
  };

  return (
    <section className="pt-0 pb-8 px-0 bg-colors-black-200 border-2 border-solid border-colors-black-600 flex flex-col w-[536px] items-center gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
        <header className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </header>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <form className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <label className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {field.label}
                    </label>
                    {index === 1 && (
                      <div className="flex-1 mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        {""}
                      </div>
                    )}
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Location icon"
                    src={field.icon}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {dateTimeFields.map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <label className="w-fit mt-[-1.00px] font-medium whitespace-nowrap relative [font-family:'Poppins',Helvetica] text-colors-white-800 text-sm tracking-[0] leading-6">
                      {field.label}
                    </label>
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Calendar or time icon"
                    src={field.icon}
                  />
                </div>
              ))}
            </div>
          </form>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {priceItems.map((item, index) => (
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
                    <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-800 rounded-lg">
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="/img/icon-16-px-38.svg"
                />

                <div className="flex-1 grow flex items-center justify-between relative">
                  <label className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </label>

                  <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="w-fit mt-[-1.00px] font-semibold text-colors-green-accent-500 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="w-fit mt-[-0.50px] font-semibold text-colors-green-accent-500 text-sm whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    -20 €
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <input
                  type="text"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  className="flex w-[220px] h-10 items-center gap-0.5 px-4 py-2 relative rounded-lg border border-dashed border-colors-ligh-gray-800 bg-transparent text-colors-white-800 text-sm [font-family:'Poppins',Helvetica] font-normal tracking-[0] leading-6"
                  placeholder="Zadajte promokód"
                />

                <button
                  type="button"
                  onClick={handleCancelPromoCode}
                  className="gap-1.5 bg-colors-red-accent-100 inline-flex h-10 items-center justify-center px-6 py-0 relative flex-[0_0_auto] rounded-lg all-[unset] box-border font-medium text-colors-red-accent-300 text-sm [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap cursor-pointer"
                >
                  Zrušiť
                </button>
              </div>
            </div>

            <fieldset className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <legend className="sr-only">Výber cestovnej zóny</legend>

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
                    src="/img/icon-16-px-39.svg"
                  />
                </div>

                <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
                  1000 €
                </div>
              </div>

              {travelZones.map((zone, index) => (
                <div
                  key={zone.id}
                  className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full"
                >
                  <div className="flex items-center gap-1.5 relative flex-1 grow">
                    {index === 0 ? (
                      <div className="relative w-6 h-6">
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-colors-dark-yellow-accent-300 rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                        </div>
                      </div>
                    ) : index === 1 ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Checkbox"
                        src="/img/check-boxy-24-5.svg"
                      />
                    ) : (
                      <div className="relative w-6 h-6">
                        <input
                          type="radio"
                          name="travelZone"
                          id={zone.id}
                          checked={selectedTravelZone === zone.id}
                          onChange={() => handleTravelZoneChange(zone.id)}
                          className="sr-only"
                        />
                        <label
                          htmlFor={zone.id}
                          className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-colors-dark-gray-900 cursor-pointer block"
                        />
                      </div>
                    )}

                    <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                      <span className="font-medium">{zone.label} </span>
                      {zone.sublabel && (
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                          {zone.sublabel}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </fieldset>
          </div>
        </div>
      </div>

      <footer className="flex flex-col items-center gap-6 px-8 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="h-10 px-2 py-0 self-stretch w-full flex items-center justify-between relative">
          <h2 className="text-2xl relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </h2>

          <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
            <div className="mt-[-1.00px] text-2xl text-right relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
              870 €
            </div>

            <div className="relative w-fit [font-family:'Poppins',Helvetica] font-normal text-colors-dark-gray-900 text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
              vrátane DPH
            </div>
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Divider line"
          src="/img/line-18-3.svg"
        />

        <div className="pl-2 pr-0 py-0 flex-[0_0_auto] flex items-center justify-between relative self-stretch w-full">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Pokračovať v objednávke
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-12 items-center justify-center gap-1.5 pl-6 pr-5 py-2 relative flex-[0_0_auto] bg-colors-light-yellow-accent-100 rounded-[99px] all-[unset] box-border font-semibold text-colors-dark-yellow-accent-100 text-base [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap cursor-pointer"
          >
            Ďalej
            <img
              className="relative w-6 h-6"
              alt="Arrow right icon"
              src="/img/icon-24-px-3.svg"
            />
          </button>
        </div>
      </footer>
    </section>
  );
};
