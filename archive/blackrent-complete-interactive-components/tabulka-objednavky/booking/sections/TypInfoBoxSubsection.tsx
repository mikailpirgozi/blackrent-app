import React, { useState } from "react";

interface TypInfoBoxSubsectionProps {
  onPromoCodeClick?: () => void;
  onFormFilled?: () => void;
  onBackToDefault?: () => void;
}

export const TypInfoBoxSubsection: React.FC<TypInfoBoxSubsectionProps> = ({
  onPromoCodeClick,
  onFormFilled,
  onBackToDefault,
}) => {
  const [selectedCountries, setSelectedCountries] = useState("basic");
  const [showTooltip, setShowTooltip] = useState(true); // Zobrazuje tooltip podľa Figma

  const formFields = [
    { label: "Miesto vyzdvihnutia", placeholder: "Miesto vyzdvihnutia" },
    { label: "Miesto vrátenia", placeholder: "Miesto vrátenia" },
    { label: "Deň vyzdvihnutia", placeholder: "Deň vyzdvihnutia" },
    { label: "Deň vrátenia", placeholder: "Deň vrátenia" },
    { label: "Čas vyzdvihnutia", placeholder: "Čas vyzdvihnutia" },
    { label: "Čas vrátenia", placeholder: "Čas vrátenia" },
  ];

  const pricingItems = [
    { label: "Počet povolených km", value: "" },
    { label: "Cena prenájmu", value: "" },
    { label: "Poistenie", sublabel: "(základné)", value: "" },
  ];

  const countryOptions = [
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
      type: "checkbox",
    },
    {
      id: "outside",
      label: "Mimo EU",
      sublabel: "(individuálne posúdenie, kontaktujte nás)",
      selected: false,
      type: "checkbox",
    },
  ];

  const handleCountrySelection = (id: string) => {
    setSelectedCountries(id);
  };

  const toggleTooltip = () => {
    setShowTooltip(!showTooltip);
  };

  return (
    <div className="bg-[#1E1E23] flex flex-col w-[328px] sm:w-[536px] md:w-[680px] items-center gap-4 sm:gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 sm:gap-8 px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-3xl overflow-hidden">
        <header className="relative w-[206px] h-4 mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </header>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <form className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(0, 2).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none placeholder:text-[#BEBEC3]"
                      aria-label={field.label}
                    />
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Dropdown icon"
                    src="/assets/icon-16-px-28.svg"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(2, 4).map((field, index) => (
                <div
                  key={index + 2}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="date"
                      placeholder={field.placeholder}
                      className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none placeholder:text-[#BEBEC3]"
                      aria-label={field.label}
                    />
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Calendar icon"
                    src="/assets/icon-16-px-28.svg"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(4, 6).map((field, index) => (
                <div
                  key={index + 4}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="time"
                      placeholder={field.placeholder}
                      className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none placeholder:text-[#BEBEC3]"
                      aria-label={field.label}
                    />
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Time icon"
                    src="/assets/icon-16-px-28.svg"
                  />
                </div>
              ))}
            </div>
          </form>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {pricingItems.map((item, index) => (
                <div
                  key={index}
                  className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full"
                >
                  <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                    <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                      {item.label}
                      {item.sublabel && (
                        <span className="font-sf-pro font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                          {" "}
                          {item.sublabel}
                        </span>
                      )}
                    </div>
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
              aria-label="Mám promokód"
            >
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="/assets/icon-16-px-51.svg"
                />
                <div className="flex-1 grow flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-0.50px] font-sf-pro font-medium text-[#BEBEC3] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </div>
                  <div className="w-fit mt-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-[#3CEB82] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </button>

            {/* Tooltip zobrazený podľa Figma dizajnu */}
            {showTooltip && (
              <div className="absolute w-[190px] h-24 top-28 left-32 z-10">
                <div className="relative w-[188px] h-[94px] bg-[#37373C] rounded-lg p-2.5">
                  <p className="absolute w-[168px] h-[55px] top-[11px] left-2.5 text-[#F0F0F5] text-[10px] leading-4 font-sf-pro font-normal tracking-[0]">
                    Depozit je vratná záloha za auto ktorá sa platí pri
                    prevziatí auta na mieste a vracia po skončení prenájmu
                    zákaznákovi.
                  </p>
                </div>
              </div>
            )}

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
                    onClick={toggleTooltip}
                    className="relative w-4 h-4 cursor-pointer"
                    aria-label="Informácie o depozite"
                  >
                    <img
                      className="relative w-4 h-4"
                      alt="Info icon"
                      src="/assets/icon-16-px-15.svg"
                    />
                  </button>
                </div>
                <div className="w-fit mr-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </div>

              <fieldset className="flex flex-col gap-0 relative self-stretch w-full">
                <legend className="sr-only">Výber krajín pre prenájom</legend>
                {countryOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full"
                  >
                    <label className="flex items-center gap-1.5 relative flex-1 grow cursor-pointer">
                      {index === 0 ? (
                        <div className="relative w-6 h-6">
                          <div className="relative w-5 h-5 top-0.5 left-0.5 bg-[#3C4804] rounded-[10px]">
                            <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                          </div>
                          <input
                            type="radio"
                            name="countries"
                            value={option.id}
                            checked={selectedCountries === option.id}
                            onChange={() => handleCountrySelection(option.id)}
                            className="sr-only"
                            aria-describedby={`${option.id}-description`}
                          />
                        </div>
                      ) : index === 1 ? (
                        <>
                          <img
                            className="relative w-6 h-6"
                            alt="Checkbox checked"
                            src="/assets/check-boxy-24-5.svg"
                          />
                          <input
                            type="checkbox"
                            value={option.id}
                            className="sr-only"
                            aria-describedby={`${option.id}-description`}
                          />
                        </>
                      ) : (
                        <>
                          <div className="relative w-6 h-6">
                            <div className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-[#646469]" />
                          </div>
                          <input
                            type="checkbox"
                            value={option.id}
                            className="sr-only"
                            aria-describedby={`${option.id}-description`}
                          />
                        </>
                      )}
                      <p
                        id={`${option.id}-description`}
                        className="relative flex-1 font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6"
                      >
                        <span className="font-medium">{option.label}</span>
                        {option.sublabel && (
                          <span className="font-sf-pro font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                            {" "}
                            {option.sublabel}
                          </span>
                        )}
                      </p>
                    </label>
                  </div>
                ))}
              </fieldset>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
