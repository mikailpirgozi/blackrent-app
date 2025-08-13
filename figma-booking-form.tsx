import React, { useState } from "react";

interface FormField {
  id: string;
  label: string;
  value: string;
}

interface PricingItem {
  label: string;
  value: string;
  isHighlighted?: boolean;
}

interface TravelOption {
  id: string;
  label: string;
  description?: string;
  isSelected: boolean;
  isDisabled?: boolean;
}

export const TabulkaObjednavky = (): JSX.Element => {
  const [formFields] = useState<FormField[]>([
    { id: "pickup-location", label: "Miesto vyzdvihnutia", value: "" },
    { id: "return-location", label: "Miesto vrátenia", value: "" },
    { id: "pickup-date", label: "Deň vyzdvihnutia", value: "" },
    { id: "return-date", label: "Deň vrátenia", value: "" },
    { id: "pickup-time", label: "Čas vyzdvihnutia", value: "" },
    { id: "return-time", label: "Čas vrátenia", value: "" },
  ]);

  const [pricingItems] = useState<PricingItem[]>([
    { label: "Počet povolených km", value: "" },
    { label: "Cena prenájmu", value: "" },
    { label: "Poistenie", value: "" },
  ]);

  const [travelOptions, setTravelOptions] = useState<TravelOption[]>([
    {
      id: "basic",
      label: "Slovensko, Česko, Rakúsko",
      isSelected: true,
    },
    {
      id: "extended",
      label: "+Poľsko, Nemecko, Maďarsko",
      description: "(+30% depozit)",
      isSelected: false,
    },
    {
      id: "eu",
      label: "Celá EU okrem Rumunska",
      description: "(+60% depozit)",
      isSelected: false,
    },
    {
      id: "outside-eu",
      label: "Mimo EU",
      description: "(individuálne posúdenie, kontaktujte nás)",
      isSelected: false,
    },
  ]);

  const handleTravelOptionChange = (optionId: string) => {
    setTravelOptions((options) =>
      options.map((option) => ({
        ...option,
        isSelected: option.id === optionId,
      })),
    );
  };

  const renderFormField = (field: FormField, index: number) => (
    <div
      key={field.id}
      className="h-10 items-center gap-0.5 pl-4 pr-3 py-0 flex-1 grow bg-colors-black-600 rounded-lg flex relative"
    >
      <div className="items-center gap-1 flex-1 grow flex relative">
        <label
          htmlFor={field.id}
          className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap"
        >
          {field.label}
        </label>
      </div>
      <img
        className="relative w-5 h-5"
        alt="Dropdown icon"
        src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-5.svg"
      />
    </div>
  );

  const renderPricingItem = (item: PricingItem, index: number) => {
    if (index === 2) {
      return (
        <div
          key={index}
          className="h-8 items-center justify-around gap-2 p-4 self-stretch w-full flex relative"
        >
          <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
            <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              <span className="font-semibold">Poistenie </span>
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-base tracking-[0] leading-6">
                (základné)
              </span>
            </p>
            <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              {item.value}
            </div>
            <div className="relative w-fit mt-[-1.00px] mr-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              {""}
            </div>
          </div>
        </div>
      );
    }

    if (index === 1) {
      return (
        <div
          key={index}
          className="flex-col h-8 items-start justify-around gap-2 p-4 self-stretch w-full flex relative"
        >
          <div className="self-stretch w-full flex-[0_0_auto] mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
            <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
              {item.label}
            </div>
            <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              {item.value}
            </div>
            <div className="relative w-fit mt-[-1.00px] mr-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
              {""}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="h-8 items-center justify-around gap-2 p-4 self-stretch w-full flex relative"
      >
        <div className="flex-1 grow mt-[-5.50px] mb-[-5.50px] flex items-center justify-between relative">
          <div className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap">
            {item.label}
          </div>
          <div className="relative w-fit mt-[-1.00px] mr-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
            {item.value}
          </div>
        </div>
      </div>
    );
  };

  const renderTravelOption = (option: TravelOption, index: number) => {
    if (index === 0) {
      return (
        <div
          key={option.id}
          className="h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 self-stretch w-full flex relative"
        >
          <div className="items-center gap-1.5 flex-1 grow flex relative">
            <div className="relative w-6 h-6">
              <div className="relative w-5 h-5 top-0.5 left-0.5 bg-colors-dark-yellow-accent-300 rounded-[10px]">
                <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
              </div>
            </div>
            <div className="relative flex-1 [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6">
              {option.label}
            </div>
          </div>
        </div>
      );
    }

    if (index === 1) {
      return (
        <div
          key={option.id}
          className="h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 self-stretch w-full flex relative"
        >
          <div className="items-center gap-1.5 flex-1 grow flex relative">
            <img
              className="relative w-6 h-6"
              alt="Checkbox"
              src="https://c.animaapp.com/LjmxlyCT/img/check-boxy-24.svg"
            />
            <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
              <span className="font-medium">+Poľsko, Nemecko, Maďarsko </span>
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                (+30% depozit)
              </span>
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        key={option.id}
        className="h-8 items-center justify-around gap-2 pl-4 pr-0 py-0 self-stretch w-full flex relative"
      >
        <div className="items-center gap-1.5 flex-1 grow flex relative">
          <button
            type="button"
            onClick={() => handleTravelOptionChange(option.id)}
            className="relative w-6 h-6 cursor-pointer"
            aria-label={`Select ${option.label}`}
          >
            <div
              className={`relative w-5 h-5 top-0.5 left-0.5 rounded-[10px] border-2 border-solid ${
                option.isSelected
                  ? "bg-colors-dark-yellow-accent-300 border-colors-dark-yellow-accent-300"
                  : "border-colors-dark-gray-900"
              }`}
            >
              {option.isSelected && (
                <div className="relative w-3 h-3 top-1 left-1 bg-colors-light-yellow-accent-100 rounded-md" />
              )}
            </div>
          </button>
          <p className="relative flex-1 [font-family:'Poppins',Helvetica] font-normal text-colors-white-800 text-sm tracking-[0] leading-6">
            <span className="font-medium">{option.label} </span>
            {option.description && (
              <span className="[font-family:'Poppins',Helvetica] font-normal text-[#f0f0f5] text-sm tracking-[0] leading-6">
                {option.description}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col w-[536px] items-center gap-6 relative bg-colors-black-600 rounded-3xl overflow-hidden"
      data-model-id="10786:21170"
    >
      <form className="flex-col items-start gap-8 px-6 py-8 self-stretch w-full flex-[0_0_auto] bg-colors-black-400 rounded-3xl overflow-hidden flex relative">
        <h1 className="relative w-[206px] h-4 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-xl tracking-[0] leading-7 whitespace-nowrap">
          Prenájom vozidla
        </h1>

        <div className="flex-col items-start gap-6 self-stretch w-full flex-[0_0_auto] flex relative">
          <fieldset className="flex-col items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
            <legend className="sr-only">Rental details</legend>

            <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
              {renderFormField(formFields[0], 0)}
              {renderFormField(formFields[1], 1)}
            </div>

            <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
              {renderFormField(formFields[2], 2)}
              {renderFormField(formFields[3], 3)}
            </div>

            <div className="items-start gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
              {renderFormField(formFields[4], 4)}
              {renderFormField(formFields[5], 5)}
            </div>
          </fieldset>

          <section className="flex-col items-center gap-4 self-stretch w-full flex-[0_0_auto] flex relative">
            <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              {pricingItems.map((item, index) =>
                renderPricingItem(item, index),
              )}
            </div>

            <div className="flex-col h-10 items-start justify-center gap-4 p-4 self-stretch w-full bg-colors-black-600 rounded-lg flex relative">
              <div className="items-center gap-1.5 self-stretch w-full flex-[0_0_auto] mt-[-4.00px] mb-[-4.00px] flex relative">
                <img
                  className="relative w-4 h-4"
                  alt="Promo code icon"
                  src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-6.svg"
                />

                <div className="flex-1 grow flex items-center justify-between relative">
                  <div className="relative w-fit mt-[-0.50px] [font-family:'Poppins',Helvetica] font-medium text-colors-ligh-gray-800 text-sm tracking-[0] leading-6 whitespace-nowrap">
                    Mám promokód
                  </div>

                  <div className="mt-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>

                  <div className="mt-[-1.00px] mr-[-1.00px] text-colors-green-accent-500 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                    {""}
                  </div>
                </div>
              </div>
            </div>

            <fieldset className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
              <legend className="flex h-8 items-center justify-between px-4 py-0 relative self-stretch w-full">
                <div className="items-center gap-2 flex-1 grow flex relative">
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
                    src="https://c.animaapp.com/LjmxlyCT/img/icon-16-px-7.svg"
                  />
                </div>

                <div className="mr-[-1.00px] text-colors-white-800 relative w-fit [font-family:'Poppins',Helvetica] font-semibold text-base tracking-[0] leading-6 whitespace-nowrap overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical]">
                  {""}
                </div>
              </legend>

              {travelOptions.map((option, index) =>
                renderTravelOption(option, index),
              )}
            </fieldset>
          </section>
        </div>
      </form>
    </div>
  );
};
