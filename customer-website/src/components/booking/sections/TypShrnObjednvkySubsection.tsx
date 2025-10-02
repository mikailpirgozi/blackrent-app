import React, { useState } from "react";

interface TypShrnObjednvkySubsectionProps {
  onConfirm?: () => void;
  onBackToFilled?: () => void;
}

export const TypShrnObjednvkySubsection: React.FC<TypShrnObjednvkySubsectionProps> = ({
  onConfirm,
  onBackToFilled,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [selectedTravelZone, setSelectedTravelZone] = useState<string>("basic");

  const carSpecs = [
    { icon: "/assets/icon-16-px-40.svg", text: "123 kW" },
    { icon: "/assets/icon-16-px-41.svg", text: "Automat" },
    { icon: "/assets/icon-16-px-42.svg", text: "Benzín" },
    { icon: "/assets/icon-16-px-43.svg", text: "Predný" },
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
    onConfirm?.();
  };

  return (
    <div className="pt-0 pb-8 px-0 bg-[#0A0A0F] border-2 border-solid border-[#1E1E23] flex flex-col w-[328px] sm:w-[400px] md:w-[680px] lg:w-[448px] xl:w-[448px] 2xl:w-[536px] items-center gap-4 sm:gap-6 relative rounded-3xl overflow-hidden">
      <div className="flex flex-col items-start gap-6 pt-4 sm:pt-6 pb-6 sm:pb-8 px-4 sm:px-6 md:px-8 relative self-stretch w-full flex-[0_0_auto] bg-[#141419] rounded-3xl overflow-hidden">
        {/* Car Summary Card */}
        <div className="flex h-[296px] sm:h-[216px] flex-col sm:flex-row items-start justify-around gap-4 sm:gap-[76px] p-4 sm:p-6 relative self-stretch w-full bg-[#0A0A0F] rounded-2xl overflow-hidden">
          {/* Mobile Layout (360px) - Frame 517 */}
          <div className="flex flex-col gap-4 relative w-[296px] h-[296px] p-4 sm:hidden bg-[#0A0A0F] rounded-2xl">
            {/* Frame 519 - Title and Specs */}
            <div className="flex flex-col gap-3 relative self-stretch flex-[0_0_auto]">
              {/* Car Title */}
              <h2 className="relative self-stretch h-4 font-sf-pro font-semibold text-[#F0FF98] text-base tracking-[0] leading-5">
                Porsche Panamera Turbo
              </h2>

              {/* Frame 518 - Car Specs Row with Wrap */}
              <div className="flex flex-row flex-wrap items-start gap-[6px] relative self-stretch flex-[0_0_auto]">
                {carSpecs.map((spec, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 relative flex-[0_0_auto]"
                  >
                    <img
                      className="relative w-4 h-4"
                      alt="Car specification icon"
                      src={spec.icon}
                    />
                    <div className="relative w-fit text-[#A0A0A5] text-[10px] leading-6 whitespace-nowrap font-sf-pro font-normal tracking-[0]">
                      {spec.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Car Image - Frame 170 */}
            <div className="relative self-stretch flex-1 rounded-lg bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/assets/car-image-mobile-4c02b7.png)'}} />

            {/* Logo + Rating */}
            <div className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]">
              <div className="relative w-[107.2px] h-4">
                <img
                  className="relative w-full h-full"
                  alt="BlackRent logo"
                  src="/assets/vector.svg"
                />
              </div>
              <img
                className="relative w-4 h-4"
                alt="Rating icon"
                src="/assets/icon-16-px-44.svg"
              />
            </div>
          </div>

          {/* Desktop/Tablet Layout (sm+) - Row */}
          <div className="hidden sm:flex items-start gap-4 relative flex-1 self-stretch grow">
            <div className="flex flex-col items-start justify-between relative flex-1 self-stretch grow">
              <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <h2 className="relative self-stretch mt-[-1.00px] font-['SF_Pro'] font-semibold text-[#F0FF98] text-xl tracking-[0] leading-6">
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
                        <div className="relative w-fit text-[#A0A0A5] text-xs leading-6 whitespace-nowrap font-sf-pro font-normal tracking-[0]">
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
                        <div className="relative w-fit text-[#A0A0A5] text-xs leading-6 whitespace-nowrap font-sf-pro font-normal tracking-[0]">
                          {spec.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="inline-flex items-start gap-1.5 relative flex-[0_0_auto]">
                <div className="relative w-[107.2px] h-4">
                  <img
                    className="relative w-full h-full"
                    alt="BlackRent logo"
                    src="/assets/vector.svg"
                  />
                </div>
                <img
                  className="relative w-4 h-4"
                  alt="Rating icon"
                  src="/assets/icon-16-px-44.svg"
                />
              </div>
            </div>

            <div className="relative flex-1 self-stretch grow rounded-lg bg-cover bg-center bg-no-repeat" style={{backgroundImage: 'url(/assets/car-image-mobile-4c02b7.png)'}} />
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {locationFields.map((field, index) => (
              <div
                key={index}
                className="flex h-10 sm:h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-[#F0F0F5] text-sm relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/assets/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {dateTimeFields.slice(0, 2).map((field, index) => (
              <div
                key={index}
                className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="w-fit mt-[-1.00px] font-medium whitespace-nowrap relative font-sf-pro text-[#F0F0F5] text-sm tracking-[0] leading-6">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-[#F0F0F5] text-sm relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/assets/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
            {dateTimeFields.slice(2, 4).map((field, index) => (
              <div
                key={index}
                className="flex h-10 items-center gap-0.5 pl-4 pr-3 py-0 relative w-full sm:flex-1 sm:grow bg-[#1E1E23] rounded-lg"
              >
                <div className="flex items-center gap-1 relative flex-1 grow">
                  <div className="relative w-fit mt-[-1.00px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                    {field.label}
                  </div>
                  <div className="flex-1 mt-[-1.00px] font-normal text-[#F0F0F5] text-sm relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {field.value}
                  </div>
                </div>
                <img
                  className="relative w-5 h-5"
                  alt="Dropdown icon"
                  src="/assets/icon-16-px-50.svg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
            {priceBreakdown.map((item, index) => (
              <div
                key={index}
                className="flex h-8 items-center justify-around gap-2 p-4 relative self-stretch w-full"
              >
                <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                    {item.label}
                  </div>
                  <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code Applied */}
          <div className="flex flex-col items-start gap-4 p-4 self-stretch w-full bg-[#1E1E23] rounded-lg relative flex-[0_0_auto]">
            <div className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]">
              <img
                className="relative w-4 h-4"
                alt="Promo code icon"
                src="/assets/icon-16-px-51.svg"
              />
              <div className="flex-1 grow flex items-center justify-between relative">
                <div className="relative w-fit mt-[-0.50px] font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6 whitespace-nowrap">
                  Mám promokód
                </div>
                <div className="w-fit mt-[-0.50px] font-semibold text-[#3CEB82] text-sm whitespace-nowrap relative font-sf-pro tracking-[0] leading-6 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  -20 €
                </div>
              </div>
            </div>
          </div>

          {/* Travel Zones */}
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
                  src="/assets/icon-16-px-52.svg"
                />
              </div>
              <div className="text-base overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
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
                            ? "bg-[#3C4804]"
                            : "border-2 border-solid border-[#646469]"
                        }`}
                      >
                        {(zone.selected || selectedTravelZone === zone.id) && (
                          <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <img
                      className="relative w-6 h-6"
                      alt="Checkbox"
                      src="/assets/check-boxy-24-5.svg"
                    />
                  )}
                  <p className="relative flex-1 font-sf-pro font-normal text-[#F0F0F5] text-sm tracking-[0] leading-6">
                    <span className="font-medium">{zone.label}</span>
                    {zone.note && (
                      <span className="font-sf-pro font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
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

      {/* Frame 2608544 - Final Payment Section */}
      <div className="flex flex-col items-center gap-4 sm:gap-4 md:gap-6 px-8 sm:px-6 md:px-6 py-0 relative self-stretch w-full flex-[0_0_auto]">
        {/* Price Header */}
        <div className="flex items-center justify-between px-2 py-0 relative self-stretch w-full h-10">
          <div className="text-2xl relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
            Cena
          </div>
          <div className="inline-flex flex-col items-end gap-3 relative flex-[0_0_auto]">
            <div className="mt-[-1.00px] text-2xl text-right relative w-fit font-sf-pro font-semibold text-[#F0F0F5] tracking-[0] leading-6 whitespace-nowrap">
              1208 €
            </div>
            <div className="relative w-fit font-sf-pro font-normal text-[#646469] text-xs text-right tracking-[0] leading-6 whitespace-nowrap">
              vrátane DPH
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <img
          className="relative self-stretch w-full h-px ml-[-0.50px] mr-[-0.50px]"
          alt="Divider line"
          src="/assets/line-18-3.svg"
        />

        {/* Frame 2608541 - Payment Options Section */}
        <div className="flex flex-col gap-2 pl-2 pr-0 py-0 relative self-stretch w-full flex-[0_0_auto]">
          {/* Payment Options Header */}
          <div className="flex items-center gap-2 relative self-stretch w-full h-8">
            <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
              <div className="relative w-fit mt-[-1.00px] font-sf-pro font-semibold text-[#F0F0F5] text-base tracking-[0] leading-6 whitespace-nowrap">
                Možnosť platby
              </div>
            </div>
          </div>

          {/* Frame 2608543 - Payment Methods and Button */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 relative self-stretch w-full flex-[0_0_auto]">
            {/* Frame 2608542 - Payment Methods */}
            <div className="flex flex-col gap-2 relative flex-1 grow">
              {/* Frame 132 - Card Payment */}
              <div className="flex items-center gap-2 relative self-stretch w-full h-8">
                <div className="flex items-center gap-1.5 relative w-[77px]">
                  <button
                    onClick={() => handlePaymentMethodChange("card")}
                    className="relative w-6 h-6 cursor-pointer"
                    aria-label="Select card payment method"
                  >
                    <div
                      className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                        selectedPaymentMethod === "card"
                          ? "border-[#D7FF14] bg-[#3C4804]"
                          : "border-[#646469]"
                      }`}
                    >
                      {selectedPaymentMethod === "card" && (
                        <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                      )}
                    </div>
                  </button>
                  <div className="relative flex-1 font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6">
                    Kartou
                  </div>
                </div>
              </div>

              {/* Frame 133 - Cash Payment */}
              <div className="flex items-center gap-2 relative self-stretch w-full h-8">
                <div className="flex items-center gap-1.5 relative w-[181px]">
                  <button
                    onClick={() => handlePaymentMethodChange("cash")}
                    className="relative w-6 h-6 cursor-pointer"
                    aria-label="Select cash payment method"
                  >
                    <div
                      className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                        selectedPaymentMethod === "cash"
                          ? "border-[#D7FF14] bg-[#3C4804]"
                          : "border-[#646469]"
                      }`}
                    >
                      {selectedPaymentMethod === "cash" && (
                        <div className="relative w-3 h-3 top-1 left-1 bg-[#D7FF14] rounded-md" />
                      )}
                    </div>
                  </button>
                  <div className="relative flex-1 font-sf-pro font-medium text-[#F0F0F5] text-sm tracking-[0] leading-6">
                    Hotovosť (na mieste)
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Button - Potvrdiť */}
            <button
              onClick={handleConfirm}
              className="inline-flex h-12 items-center justify-center gap-1.5 pl-6 pr-5 py-2 relative flex-[0_0_auto] w-full sm:self-stretch bg-[#D7FF14] rounded-[99px] cursor-pointer hover:bg-[#C5E612] transition-colors"
              aria-label="Confirm booking"
            >
              <span className="font-semibold text-[#141900] text-base relative w-fit font-sf-pro tracking-[0] leading-6 whitespace-nowrap">
                Potvrdiť
              </span>
              <img
                className="relative w-6 h-6"
                alt="Confirm icon"
                src="/assets/icon-24-px-3.svg"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
