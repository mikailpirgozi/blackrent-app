import React, { useState } from "react";

interface TypPoVyplnenSubsectionProps {
  onPromoCodeClick?: () => void;
  onContinue?: () => void;
  onBackToDefault?: () => void;
}

export const TypPoVyplnenSubsection: React.FC<TypPoVyplnenSubsectionProps> = ({
  onPromoCodeClick,
  onContinue,
  onBackToDefault,
}) => {
  const [selectedCountryOption, setSelectedCountryOption] = useState(0);

  const formFields = [
    { label: "Trenčín", icon: "/assets/icon-16-px-28.svg" },
    { label: "Bratislava", icon: "/assets/icon-16-px-28.svg" },
    { label: "8. 11. 2023", icon: "/assets/icon-16-px-28.svg" },
    { label: "10. 11. 2023", icon: "/assets/icon-16-px-28.svg" },
    { label: "14:00", icon: "/assets/icon-16-px-28.svg" },
    { label: "18:00", icon: "/assets/icon-16-px-28.svg" },
  ];

  const priceItems = [
    { label: "Počet povolených km", value: "1700 km" },
    { label: "Cena prenájmu", value: "890 €" },
    { label: "Poistenie", sublabel: "(základné)", value: "890 €" },
  ];

  const countryOptions = [
    {
      id: 0,
      label: "Slovensko, Česko, Rakúsko",
      selected: true,
      type: "radio",
    },
    {
      id: 1,
      label: "+Poľsko, Nemecko, Maďarsko",
      sublabel: "(+30% depozit)",
      selected: false,
      type: "checkbox",
    },
    {
      id: 2,
      label: "Celá EU okrem Rumunska",
      sublabel: "(+60% depozit)",
      selected: false,
      type: "radio",
    },
    {
      id: 3,
      label: "Mimo EU",
      sublabel: "(individuálne posúdenie, kontaktujte nás)",
      selected: false,
      type: "radio",
    },
  ];

  const handleCountryOptionChange = (optionId: number) => {
    setSelectedCountryOption(optionId);
  };

  return (
    <div className="pt-0 pb-8 px-0 bg-[#0A0A0F] border-2 border-solid border-[#1E1E23] flex flex-col w-[328px] sm:w-[536px] md:w-[680px] items-center gap-4 sm:gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 sm:gap-8 px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-3xl overflow-hidden">
        <h2 className="relative w-[206px] h-4 mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </h2>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(0, 2).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none"
                    />
                    {index === 1 && (
                      <div className="flex-1 mt-[-1.00px] font-normal text-[#F0F0F5] text-sm relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        {""}
                      </div>
                    )}
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Icon px"
                    src={field.icon}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(2, 4).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="w-fit mt-[-1.00px] font-medium whitespace-nowrap relative font-sf-pro text-[#F0F0F5] text-sm tracking-[0] leading-6 bg-transparent border-none outline-none"
                    />
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Icon px"
                    src={field.icon}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(4, 6).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none"
                    />
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Icon px"
                    src={field.icon}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {priceItems.map((item, index) => (
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
                    <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
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
                  alt="Icon px"
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
                  <img
                    className="relative w-4 h-4"
                    alt="Icon px"
                    src="/assets/icon-16-px-23.svg"
                  />
                </div>
                <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
                  1000 €
                </div>
              </div>

              {countryOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full"
                >
                  <div className="flex items-center gap-1.5 relative flex-1 grow">
                    {option.id === 0 ? (
                      <div className="relative w-6 h-6">
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-[#3C4804] rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                        </div>
                      </div>
                    ) : option.id === 1 ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Check boxy"
                        src="/assets/check-boxy-24-5.svg"
                      />
                    ) : (
                      <button
                        onClick={() => handleCountryOptionChange(option.id)}
                        className="relative w-6 h-6 cursor-pointer"
                      >
                        <div
                          className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                            selectedCountryOption === option.id
                              ? "bg-[#3C4804] border-[#3C4804]"
                              : "border-[#646469]"
                          }`}
                        >
                          {selectedCountryOption === option.id && (
                            <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                          )}
                        </div>
                      </button>
                    )}
                    <p className="relative flex-1 font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6">
                      <span className="font-medium">{option.label} </span>
                      {option.sublabel && (
                        <span className="font-sf-pro font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                          {option.sublabel}
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

      <div className="flex flex-col items-center gap-6 px-8 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="h-10 px-2 py-0 self-stretch w-full flex items-center justify-between relative">
          <div className="text-2xl relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </div>
          <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
            <div className="mt-[-1.00px] text-2xl text-right relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
              870 €
            </div>
            <div className="relative w-fit font-sf-pro font-normal text-[#646469] text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
              vrátane DPH
            </div>
          </div>
        </div>

        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Line"
          src="/assets/line-18-3.svg"
        />

        <div className="pl-2 pr-0 py-0 flex-[0_0_auto] flex items-center justify-center relative self-stretch w-full">
          <button 
            onClick={onContinue}
            className="inline-flex h-12 items-center justify-center gap-1.5 px-5 py-2 relative flex-[0_0_auto] bg-[#D7FF14] rounded-[99px] cursor-pointer hover:bg-[#C5E612] transition-colors"
            style={{ paddingLeft: '24px', paddingRight: '20px' }}
            aria-label="Continue to additional services"
          >
            <span className="font-semibold text-[#141900] text-base relative w-fit font-poppins tracking-[0] leading-6 whitespace-nowrap">
              Ďalšie služby
            </span>
            <img
              className="relative w-6 h-6"
              alt="Arrow right icon"
              src="/assets/arrow-right-24px.svg"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
