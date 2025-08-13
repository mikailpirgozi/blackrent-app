/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

"use client";

import React, { useState } from "react";
import { PrimaryButtons } from "../PrimaryButtons";
import { TypMenuWrapper } from "../TypMenuWrapper";

interface Props {
  type: "default-b";
  className: any;
  divClassName?: any;
  onSubmit?: (email: string) => void;
}

export const InteractiveEMailNewsletter = ({
  type,
  className,
  divClassName,
  onSubmit,
}: Props): JSX.Element => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Prosím zadajte platný e-mail");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(email);
      }
      
      // Success feedback
      alert("Ďakujeme za prihlásenie k newsletteru!");
      setEmail("");
    } catch (error) {
      alert("Nastala chyba. Skúste to prosím znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`flex w-[391px] items-center justify-between pl-4 pr-2 py-2 relative bg-colors-black-600 rounded-[99px] overflow-hidden ${className}`}
      >
        <div className="flex items-center gap-2 relative flex-1 grow">
          <TypMenuWrapper
            className="!relative !left-[unset] !top-[unset]"
            typ="message"
            typMessage="https://c.animaapp.com/h23eak6p/img/icon-24-px-87.svg"
          />
          <input
            type="email"
            value={email}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Váš e-mail"
            disabled={isSubmitting}
            className={`relative flex-1 bg-transparent border-none outline-none [font-family:'Poppins',Helvetica] font-medium text-colors-white-800 text-sm tracking-[0] leading-6 placeholder:text-colors-dark-gray-900 ${divClassName}`}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'textfield',
            }}
          />
        </div>

        <button type="submit" disabled={isSubmitting || !email.trim()}>
          <PrimaryButtons
            className="!flex-[0_0_auto]"
            iconPxTypArrowRight="https://c.animaapp.com/h23eak6p/img/icon-16-px-33.svg"
            text={isSubmitting ? "..." : "Potvrdiť"}
            tlacitkoNaTmavemem40="tlacitko-na-tmavemem-403"
          />
        </button>
      </div>
    </form>
  );
};
