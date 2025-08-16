import React, { useState } from "react";

// Import všetkých subsections z Anima exportu
import { TypDefaultSubsection } from "./sections/TypDefaultSubsection";
import { TypInfoBoxSubsection } from "./sections/TypInfoBoxSubsection";
import { TypPoVyplnenSubsection } from "./sections/TypPoVyplnenSubsection";
import { TypPromoKdSubsection } from "./sections/TypPromoKdSubsection";
import { TypPromoKdFilledSubsection } from "./sections/TypPromoKdFilledSubsection";
import { TypShrnObjednvkySubsection } from "./sections/TypShrnObjednvkySubsection";

export type BookingState = 
  | "default"
  | "info-box"
  | "po-vyplneni"
  | "promo-kod-selected"
  | "promo-kod-filled"
  | "suhrn-objednavky";

interface TabulkaObjednavkyProps {
  initialState?: BookingState;
  onStateChange?: (state: BookingState) => void;
}

export const TabulkaObjednavky: React.FC<TabulkaObjednavkyProps> = ({
  initialState = "default",
  onStateChange,
}) => {
  const [currentState, setCurrentState] = useState<BookingState>(initialState);

  const handleStateChange = (newState: BookingState) => {
    setCurrentState(newState);
    onStateChange?.(newState);
  };

  // Render správnu subsection podľa aktuálneho stavu
  const renderCurrentSubsection = () => {
    switch (currentState) {
      case "default":
        return (
          <TypDefaultSubsection
            onPromoCodeClick={() => handleStateChange("promo-kod-selected")}
            onInfoClick={() => handleStateChange("info-box")}
            onFormFilled={() => handleStateChange("po-vyplneni")}
          />
        );
      
      case "info-box":
        return (
          <TypInfoBoxSubsection
            onPromoCodeClick={() => handleStateChange("promo-kod-selected")}
            onFormFilled={() => handleStateChange("po-vyplneni")}
            onBackToDefault={() => handleStateChange("default")}
          />
        );
      
      case "po-vyplneni":
        return (
          <TypPoVyplnenSubsection
            onPromoCodeClick={() => handleStateChange("promo-kod-selected")}
            onContinue={() => handleStateChange("suhrn-objednavky")}
            onBackToDefault={() => handleStateChange("default")}
          />
        );
      
      case "promo-kod-selected":
        return (
          <TypPromoKdSubsection
            onPromoCodeFilled={() => handleStateChange("promo-kod-filled")}
            onContinue={() => handleStateChange("suhrn-objednavky")}
            onBackToFilled={() => handleStateChange("po-vyplneni")}
          />
        );
      
      case "promo-kod-filled":
        return (
          <TypPromoKdFilledSubsection
            onPromoCodeCancel={() => handleStateChange("po-vyplneni")}
            onContinue={() => handleStateChange("suhrn-objednavky")}
          />
        );
      
      case "suhrn-objednavky":
        return (
          <TypShrnObjednvkySubsection
            onConfirm={() => console.log("Booking confirmed!")}
            onBackToFilled={() => handleStateChange("po-vyplneni")}
          />
        );
      
      default:
        return <TypDefaultSubsection />;
    }
  };

  return (
    <div className="w-full max-w-[328px] sm:max-w-[536px] md:max-w-[680px] mx-auto">
      {renderCurrentSubsection()}
    </div>
  );
};

export default TabulkaObjednavky;
