"use client";

import React, { useState } from "react";
import type { BookingState } from "../../components/booking/TabulkaObjednavky";
import TabulkaObjednavky from "../../components/booking/TabulkaObjednavky";

export default function TabulkaObjednavkyPage() {
  const [currentState, setCurrentState] = useState<BookingState>("default");

  const handleStateChange = (newState: BookingState) => {
    console.log("State changed to:", newState);
    setCurrentState(newState);
  };

  const stateButtons = [
    { state: "default" as BookingState, label: "Default" },
    { state: "info-box" as BookingState, label: "Info Box" },
    { state: "po-vyplneni" as BookingState, label: "Po vyplnení" },
    { state: "promo-kod-selected" as BookingState, label: "Promo kód selected" },
    { state: "promo-kod-filled" as BookingState, label: "Promo kód filled" },
    { state: "suhrn-objednavky" as BookingState, label: "Súhrn objednávky" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#F0FF98] mb-4">
            Tabulka Objednávky - Demo
          </h1>
          <p className="text-[#F0F0F5] mb-6">
            Presná implementácia podľa Figma dizajnu s interaktivitou medzi stavmi
          </p>
          
          {/* State Control Buttons */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {stateButtons.map((button) => (
              <button
                key={button.state}
                onClick={() => setCurrentState(button.state)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentState === button.state
                    ? "bg-[#D7FF14] text-[#141900]"
                    : "bg-[#1E1E23] text-[#F0F0F5] hover:bg-[#28282D]"
                }`}
              >
                {button.label}
              </button>
            ))}
          </div>

          {/* Current State Display */}
          <div className="inline-block px-4 py-2 bg-[#1E1E23] rounded-lg text-[#F0F0F5] mb-8">
            Aktuálny stav: <span className="font-semibold text-[#D7FF14]">{currentState}</span>
          </div>
        </div>

        {/* Main Component */}
        <div className="flex justify-center">
          <TabulkaObjednavky
            initialState={currentState}
            onStateChange={handleStateChange}
          />
        </div>

        {/* Instructions */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-[#F0FF98] mb-4">
            Interakcie podľa Figma dizajnu:
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#1E1E23] p-6 rounded-lg">
              <h3 className="font-semibold text-[#D7FF14] mb-3">Stavy komponentu:</h3>
              <ul className="text-[#F0F0F5] space-y-2 text-sm">
                <li><strong>Default:</strong> Základný stav s prázdnymi poliami</li>
                <li><strong>Info Box:</strong> Zobrazuje tooltip s informáciami o depozite</li>
                <li><strong>Po vyplnení:</strong> Vyplnené polia s hodnotami</li>
                <li><strong>Promo kód selected:</strong> Rozšírený promo kód input</li>
                <li><strong>Promo kód filled:</strong> Vyplnený promo kód s zľavou</li>
                <li><strong>Súhrn objednávky:</strong> Finálny súhrn s platbou</li>
              </ul>
            </div>
            <div className="bg-[#1E1E23] p-6 rounded-lg">
              <h3 className="font-semibold text-[#D7FF14] mb-3">Responzívne breakpointy:</h3>
              <ul className="text-[#F0F0F5] space-y-2 text-sm">
                <li><strong>1728px:</strong> Desktop veľký</li>
                <li><strong>1440px:</strong> Desktop štandardný</li>
                <li><strong>744px:</strong> Tablet</li>
                <li><strong>360px:</strong> Mobil</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
