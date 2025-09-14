import React from "react";
import { TypDefaultSubsection } from "./sections/TypDefaultSubsection";
import { TypInfoBoxSubsection } from "./sections/TypInfoBoxSubsection/TypInfoBoxSubsection";
import { TypPoVyplnenSubsection } from "./sections/TypPoVyplnenSubsection/TypPoVyplnenSubsection";
import { TypPromoKdFilledSubsection } from "./sections/TypPromoKdFilledSubsection/TypPromoKdFilledSubsection";
import { TypPromoKdSubsection } from "./sections/TypPromoKdSubsection/TypPromoKdSubsection";
import { TypShrnObjednvkySubsection } from "./sections/TypShrnObjednvkySubsection/TypShrnObjednvkySubsection";

export const Box = (): JSX.Element => {
  return (
    <div className="w-[3648px] h-[1467px]" data-model-id="3882:7721-frame">
      <div className="inline-flex h-[1467px] items-start gap-20 p-4 fixed top-0 left-0 rounded-[5px] overflow-hidden border border-dashed border-[#9747ff]">
        <TypDefaultSubsection />
        <TypInfoBoxSubsection />
        <TypPoVyplnenSubsection />
        <TypPromoKdSubsection />
        <TypPromoKdFilledSubsection />
        <TypShrnObjednvkySubsection />
      </div>
    </div>
  );
};
