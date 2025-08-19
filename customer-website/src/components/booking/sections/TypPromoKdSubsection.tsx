import React, { useState } from "react";

interface TypPromoKdSubsectionProps {
  onPromoCodeFilled?: () => void;
  onContinue?: () => void;
  onBackToFilled?: () => void;
}

export const TypPromoKdSubsection: React.FC<TypPromoKdSubsectionProps> = ({
  onPromoCodeFilled,
  onContinue,
  onBackToFilled,
}) => {
  const [promoCode, setPromoCode] = useState("");
  const [selectedCountryOption, setSelectedCountryOption] = useState("basic");

  const formFields = [
    {
      from: "Trenčín",
      to: "Bratislava",
      icon: "/assets/icon-16-px-28.svg",
      toIcon: "/assets/icon-16-px-50.svg",
    },
    {
      from: "8. 11. 2023",
      to: "10. 11. 2023",
      icon: "/assets/icon-16-px-28.svg",
      toIcon: "/assets/icon-16-px-50.svg",
    },
    {
      from: "14:00",
      to: "18:00",
      icon: "/assets/icon-16-px-28.svg",
      toIcon: "/assets/icon-16-px-50.svg",
    },
  ];

  const priceItems = [
    { label: "Počet povolených km", value: "1700 km" },
    { label: "Cena prenájmu", value: "890 €" },
    { label: "Poistenie", sublabel: "(základné)", value: "890 €" },
  ];

  const countryOptions = [
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

  const handlePromoCodeSubmit = () => {
    if (promoCode.trim()) {
      onPromoCodeFilled?.();
    }
  };

  const handleCountryOptionChange = (optionId: string) => {
    setSelectedCountryOption(optionId);
  };

  const handleContinueOrder = () => {
    onContinue?.();
  };

  return (
    <section className="pt-0 pb-8 px-0 bg-[#0A0A0F] border-2 border-solid border-[#1E1E23] flex flex-col w-[328px] sm:w-[400px] md:w-[680px] lg:w-[448px] xl:w-[448px] 2xl:w-[536px] items-center gap-4 sm:gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 sm:gap-8 px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-3xl overflow-hidden">
        <header className="relative w-[206px] h-4 mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </header>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {formFields.map((field, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]"
              >
                <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg">
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <div className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {field.from}
                    </div>
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Icon"
                    src={field.icon}
                  />
                </div>

                <div className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg">
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <div className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                      {field.to}
                    </div>
                    {index === 1 && (
                      <div className="flex-1 mt-[-1.00px] font-normal text-[#F0F0F5] text-sm relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        {""}
                      </div>
                    )}
                  </div>
                  <img
                    className="relative w-5 h-5"
                    alt="Icon"
                    src={field.toIcon}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {priceItems.map((item, index) => (
                <div
                  key={index}
                  className={`flex ${index === 1 ? "flex-col" : ""} h-8 items-${index === 1 ? "start justify-around" : "center justify-around"} gap-2 p-4 relative self-stretch w-full`}
                >
                  <div
                    className={`${index === 1 ? "self-stretch w-full" : ""} flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative`}
                  >
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

                    {index === 1 && (
                      <div className="w-fit mt-[-1.00px] font-semibold text-[#F0F0F5] text-base whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                        {""}
                      </div>
                    )}

                    <div
                      className={`${index === 1 ? "mt-[-1.00px] text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit" : "relative w-fit mt-[-1.00px]"} font-sf-pro font-semibold text-[#F0F0F5] ${index === 1 ? "tracking-[0] leading-6 whitespace-nowrap" : "text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]"}`}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-start gap-4 p-4 relative self-stretch w-full flex-[0_0_auto] bg-[#28282D] rounded-lg">
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="/assets/icon-16-px-38.svg"
                />

                <div className="flex-1 grow flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-0.50px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
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

              <div className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto]">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="l"
                  className="flex w-[220px] h-10 items-center gap-0.5 pl-4 pr-1 py-2 relative rounded-lg border border-dashed border-[#BEBEC3] bg-transparent font-sf-pro font-normal text-[#BEBEC3] text-sm tracking-[0] leading-6 outline-none focus:border-[#D7FF14]"
                />

                <button
                  onClick={handlePromoCodeSubmit}
                  className="gap-2 bg-[#141900] inline-flex h-10 items-center justify-center px-6 py-0 relative flex-[0_0_auto] rounded-lg all-[unset] box-border font-medium text-[#D7FF14] text-sm font-sf-pro tracking-[0] leading-6 whitespace-nowrap cursor-pointer hover:bg-[#1F2600] transition-colors"
                >
                  Potvrdiť
                </button>
              </div>
            </div>

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
                    alt="Info icon"
                    src="/assets/icon-16-px-31.svg"
                  />
                </div>

                <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
                  1000 €
                </div>
              </div>

              {countryOptions.map((option, index) => (
                <div
                  key={option.id}
                  className="flex h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 relative self-stretch w-full"
                >
                  <div className="flex items-center gap-1.5 relative flex-1 grow">
                    {index === 0 ? (
                      <div className="relative w-6 h-6">
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-[#3C4804] rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                        </div>
                      </div>
                    ) : index === 1 ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Checkbox"
                        src="/assets/check-boxy-24-5.svg"
                      />
                    ) : (
                      <button
                        onClick={() => handleCountryOptionChange(option.id)}
                        className="relative w-6 h-6 cursor-pointer"
                      >
                        <div className="relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid border-[#646469]" />
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

      <footer className="flex flex-col items-center gap-6 px-8 py-0 relative self-stretch w-full flex-[0_0_auto]">
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
          alt="Divider line"
          src="/assets/line-18-3.svg"
        />

        <div className="pl-2 pr-0 py-0 flex-[0_0_auto] flex items-center justify-between relative self-stretch w-full">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
              Pokračovať v objednávke
            </div>
          </div>

          <button
            onClick={handleContinueOrder}
            className="inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 relative flex-[0_0_auto] bg-[#D7FF14] rounded-[99px] cursor-pointer hover:bg-[#C5E612] transition-colors"
          >
            <span className="all-[unset] box-border font-semibold text-[#141900] text-base relative w-fit font-sf-pro tracking-[0] leading-6 whitespace-nowrap">
              Ďalej
            </span>

            <img
              className="relative w-6 h-6"
              alt="Arrow icon"
              src="/assets/icon-24-px-3.svg"
            />
          </button>
        </div>
      </footer>
    </section>
  );
};
