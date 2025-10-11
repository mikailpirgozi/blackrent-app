import React, { useState } from "react";

export const TypShrnObjednvkySubsection = (): JSX.Element => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [selectedTravelZone, setSelectedTravelZone] = useState<string>("basic");

  const carSpecs = [
    { icon: "/img/icon-16-px-40.svg", text: "123 kW" },
    { icon: "/img/icon-16-px-41.svg", text: "Automat" },
    { icon: "/img/icon-16-px-42.svg", text: "Benzín" },
    { icon: "/img/icon-16-px-43.svg", text: "Predný" },
  ];

  const locationFields = [
    { label: "Trenčín", value: "" },
    { label: "Bratislava", value: "" },
  ];

  const dateTimeFields = [
    { label: "8. 11. 2023", value: "" },
    { label: "10. 11. 2023", value: "" },
    { label: "14:00", value: "" },
    { label: "18:00", value: "" },
  ];

  const priceBreakdown = [
    { label: "Počet povolených km", value: "1700 km" },
    { label: "Cena prenájmu", value: "890 €" },
    { label: "Poistenie Kompletné", value: "123 €" },
    { label: "Ďalšie služby", value: "6 €" },
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
      label: "Poľsko, Nemecko, Maďarsko",
      note: "(+30% depozit)",
      selected: false,
      type: "checkbox",
    },
    {
      id: "eu",
      label: "Celá EU okrem Rumunska",
      note: "(+60% depozit)",
      selected: false,
      type: "radio",
    },
    {
      id: "outside-eu",
      label: "Mimo EU",
      note: "(individuálne posúdenie, kontaktujte nás)",
      selected: false,
      type: "radio",
    },
  ];

  const paymentMethods = [
    { id: "card", label: "Kartou" },
    { id: "cash", label: "Hotovosť (na mieste)" },
  ];

  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const handleTravelZoneChange = (zoneId: string) => {
    setSelectedTravelZone(zoneId);
  };

  const handleConfirm = () => {
    console.log("Booking confirmed");
  };

  return (
    <div className="pt-0 pb-8 px-0 bg-colors-black-200 border-2 border-solid border-colors-black-600 flex flex-col w-[536px] items-center gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 pt-6 pb-8 px-6 relative self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden">
        <div className="flex h-[216px] items-start justify-around gap-[76px] p-6 relative self-stretch w-full bg-colors-black-200 rounded-2xl overflow-hidden">
          <div className="flex items-start gap-4 relative flex-1 self-stretch grow">
            <div className="flex flex-col items-start justify-between relative flex-1 self-stretch grow">
              <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <h2 className="relative self-stretch mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-6">
                  Porsche Panamera Turbo
                </h2>

                <div className="flex flex-wrap items-start gap-[16px_16px] relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                    {carSpecs.slice(0, 2).map((spec, index) => (
                      <div
                        key={index}
                        className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]"
                      >
                        <img
                          className="relative w-4 h-4"
                          alt="Car specification icon"
                          src={spec.icon}
                        />
                        <div className="relative w-fit text-colors-ligh-gray-200 text-xs leading-6 whitespace-nowrap [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
                          {spec.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto]">
                    {carSpecs.slice(2, 4).map((spec, index) => (
                      <div
                        key={index}
                        className="inline-flex flex-wrap items-center gap-[4px_4px] relative flex-[0_0_auto]"
                      >
                        <img
                          className="relative w-4 h-4"
                          alt="Car specification icon"
                          src={spec.icon}
                        />
                        <div className="relative w-fit text-colors-ligh-gray-200 text-xs leading-6 whitespace-nowrap [font-family:'Poppins',Helvetica] font-normal tracking-[0]">
                          {spec.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
                <div className="relative w-[107.2px] h-4 bg-[url(/img/vector.svg)] bg-[100%_100%]" />
                <img
                  className="relative w-4 h-4"
                  alt="Rating icon"
                  src="/img/icon-16-px-44.svg"
                />
              </div>
            </div>

            <div className="relative flex-1 self-stretch grow rounded-lg bg-[url(/img/frame-170.png)] bg-cover bg-[50%_50%]" />
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {locationFields.map((field, index) => (
              <div
                key={index}
                className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/img/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>

          <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {dateTimeFields.slice(0, 2).map((field, index) => (
              <div
                key={index}
                className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="w-fit mt-[-1.00px] font-medium whitespace-nowrap relative [font-family:'Poppins',Helvetica] text-colors-white-800 text-sm tracking-[0] leading-6">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/img/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>

          <div className="flex items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {dateTimeFields.slice(2, 4).map((field, index) => (
              <div
                key={index}
                className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative flex-1 grow bg-colors-black-600 rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-colors-white-800 text-sm relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/img/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
            {priceBreakdown.map((item, index) => (
              <div
                key={index}
                className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full"
              >
                <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                    {item.label}
                  </div>
                  <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start gap-4 p-4 self-stretch w-full bg-colors-black-600 rounded-lg relative flex-[0_0_auto]">
            <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <img
                className="relative w-4 h-4"
                alt="Promo code icon"
                src="/img/icon-16-px-51.svg"
              />
              <div className="flex-1 grow flex items-center justify-between relative">
                <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Mám promokód
                </div>
                <div className="w-fit mt-[-0.50px] font-semibold text-colors-green-accent-500 text-sm whitespace-nowrap relative [font-family:'Poppins',Helvetica] tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  -20 €
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
                  src="/img/icon-16-px-52.svg"
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
                  {zone.type === "radio" ? (
                    <div className="relative w-6 h-6">
                      <div
                        className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] ${
                          zone.selected || selectedTravelZone === zone.id
                            ? "bg-colors-dark-yellow-accent-300"
                            : "border-2 border-solid border-colors-dark-gray-900"
                        }`}
                      >
                        {(zone.selected || selectedTravelZone === zone.id) && (
                          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <img
                      className="relative w-6 h-6"
                      alt="Checkbox"
                      src="/img/check-boxy-24-5.svg"
                    />
                  )}
                  <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
                    <span className="font-medium">{zone.label}</span>
                    {zone.note && (
                      <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                        {" "}
                        {zone.note}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 px-8 py-0 relative self-stretch w-full flex-[0_0_auto]">
        <div className="h-10 px-2 py-0 self-stretch w-full flex items-center justify-between relative">
          <div className="text-2xl relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </div>
          <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
            <div className="mt-[-1.00px] text-2xl text-right relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 tracking-[0] leading-6 whitespace-nowrap">
              1208 €
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

        <div className="flex flex-col items-start gap-2 pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex h-8 items-center gap-2 relative self-stretch w-full">
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
                Možnosť platby
              </div>
            </div>
          </div>

          <div className="flex items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start gap-2 relative flex-1 grow">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex h-8 items-center gap-2 relative self-stretch w-full"
                >
                  <div className="flex items-center gap-1.5 relative">
                    <button
                      onClick={() => handlePaymentMethodChange(method.id)}
                      className="relative w-6 h-6 cursor-pointer"
                      aria-label={`Select ${method.label} payment method`}
                    >
                      <div
                        className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                          selectedPaymentMethod === method.id
                            ? "border-colors-light-yellow-accent-100 bg-colors-dark-yellow-accent-300"
                            : "border-colors-dark-gray-900"
                        }`}
                      >
                        {selectedPaymentMethod === method.id && (
                          <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
                        )}
                      </div>
                    </button>
                    <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
                      {method.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirm}
              className="inline-flex h-12 items-center gap-1.5 pl-6 pr-5 py-2 relative flex-[0_0_auto] bg-colors-light-yellow-accent-100 rounded-[99px] cursor-pointer hover:bg-colors-light-yellow-accent-200 transition-colors"
              aria-label="Confirm booking"
            >
              <span className="font-semibold text-colors-dark-yellow-accent-100 text-base relative w-fit [font-family:'Poppins',Helvetica] tracking-[0] leading-6 whitespace-nowrap">
                Potvrdiť
              </span>
              <img
                className="relative w-6 h-6"
                alt="Confirm icon"
                src="/img/icon-24-px-3.svg"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
