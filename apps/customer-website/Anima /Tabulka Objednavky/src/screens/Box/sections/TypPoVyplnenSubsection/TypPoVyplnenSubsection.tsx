import React, { useState } from "react";

export const TypPoVyplnenSubsection = (): JSX.Element => {
  const [selectedCountryOption, setSelectedCountryOption] = useState(0);
  const [promoCodeExpanded, setPromoCodeExpanded] = useState(false);

  const formFields = [
    { label: "Trenčín", icon: "/img/icon-16-px-28.svg" },
    { label: "Bratislava", icon: "/img/icon-16-px-28.svg" },
    { label: "8. 11. 2023", icon: "/img/icon-16-px-28.svg" },
    { label: "10. 11. 2023", icon: "/img/icon-16-px-28.svg" },
    { label: "14:00", icon: "/img/icon-16-px-28.svg" },
    { label: "18:00", icon: "/img/icon-16-px-28.svg" },
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

  const handlePromoCodeToggle = () => {
    setPromoCodeExpanded(!promoCodeExpanded);
  };

  return (
    <div className="pt-0 pb-8 px-0 bg-colors-black-200 border-2 border-solid border-colors-black-600 flex flex-col w-[536px] items-center gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-8 px-6 py-8 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
        <h2 className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </h2>

        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(0, 2).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none"
                    />
                    {index === 1 && (
                      <div className="flex-1 mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
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

            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(2, 4).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="w-fit mt-[-1.00px] font-medium whitespace-nowrap relative [font-family:'Poppins',Helvetica] text-colors-white-800 text-sm tracking-[0] leading-6 bg-transparent border-none outline-none"
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

            <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
              {formFields.slice(4, 6).map((field, index) => (
                <div
                  key={index}
                  className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
                >
                  <div className="flex items-center gap-1 relative flex-1 grow">
                    <input
                      type="text"
                      value={field.label}
                      readOnly
                      className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap bg-transparent border-none outline-none"
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

            <button
              onClick={handlePromoCodeToggle}
              className="flex flex-col h-10 items-start justify-center gap-4 p-4 relative self-stretch w-full bg-colors-black-600 rounded-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px]">
                <img
                  className="relative w-4 h-4"
                  alt="Icon px"
                  src="/img/icon-16-px-51.svg"
                />
                <div className="flex-1 grow flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </div>
                  <div className="w-fit mt-[-1.00px] font-semibold text-colors-white-800 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                  <div className="w-fit mt-[-1.00px] mr-[-1.00px] font-semibold text-colors-green-accent-500 text-base whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </button>

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
                    alt="Icon px"
                    src="/img/icon-16-px-23.svg"
                  />
                </div>
                <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
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
                        <div className="relative w-5 h-5 top-0.5 left-0.5 bg-colors-dark-yellow-accent-300 rounded-[10px]">
                          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                        </div>
                      </div>
                    ) : option.id === 1 ? (
                      <img
                        className="relative w-6 h-6"
                        alt="Check boxy"
                        src="/img/check-boxy-24-5.svg"
                      />
                    ) : (
                      <button
                        onClick={() => handleCountryOptionChange(option.id)}
                        className="relative w-6 h-6 cursor-pointer"
                      >
                        <div
                          className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                            selectedCountryOption === option.id
                              ? "bg-colors-dark-yellow-accent-300 border-colors-dark-yellow-accent-300"
                              : "border-colors-dark-gray-900"
                          }`}
                        >
                          {selectedCountryOption === option.id && (
                            <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                          )}
                        </div>
                      </button>
                    )}
                    <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                      <span className="font-medium">{option.label} </span>
                      {option.sublabel && (
                        <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
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
          <div className="text-2xl relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </div>
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
          alt="Line"
          src="/img/line-18-3.svg"
        />

        <div className="pl-2 pr-0 py-0 flex-[0_0_auto] flex items-center justify-between relative self-stretch w-full">
          <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              Pokračovať v objednávke
            </div>
          </div>
          <button className="inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 relative flex-[0_0_auto] bg-colors-light-yellow-accent-100 rounded-[99px] cursor-pointer">
            <span className="all-[unset] box-border font-semibold text-colors-dark-yellow-accent-100 text-base relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
              Ďalej
            </span>
            <img
              className="relative w-6 h-6"
              alt="Icon px"
              src="/img/icon-24-px-3.svg"
            />
          </button>
        </div>
      </div>
    </div>
  );
};
