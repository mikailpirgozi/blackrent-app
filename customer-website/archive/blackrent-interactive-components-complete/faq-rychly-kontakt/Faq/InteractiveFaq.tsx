/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

"use client";

import React, { useState } from "react";
import { IconPxFilled } from "../IconPxFilled";

interface Props {
  className: any;
  iconPxFilledTypeArrowSmall?: string;
  iconPxFilledImg?: string;
  iconPxFilledTypeArrowSmall1?: string;
  iconPxFilledTypeArrowSmall2?: string;
  iconPxFilledTypeArrowSmall3?: string;
  iconPxFilledTypeArrowSmall4?: string;
  iconPxFilledTypeArrowSmall5?: string;
  iconPxFilledTypeArrowSmall6?: string;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Čo je zahrnuté v cene prenájmu?",
    answer: "Základné poistenie, servis, údržba a diaľničná známka pre SK a CZ."
  },
  {
    id: 2,
    question: "V akom stave je vozidlo pri odovzdaní?",
    answer: "Vozidlo je vyčistené, skontrolované a má plnú nádrž paliva."
  },
  {
    id: 3,
    question: "Do ktorých krajín môžem cestovať?",
    answer: "Po celej EÚ bez obmedzení. Pre krajiny mimo EÚ treba povolenie."
  },
  {
    id: 4,
    question: "Môžem cestovať mimo EÚ?",
    answer: "Áno, ale treba vopred požiadať o povolenie a môžu byť poplatky."
  },
  {
    id: 5,
    question: "Prevzatie mimo otváracích hodín?",
    answer: "Áno, za príplatok. Termín treba dohodnúť vopred."
  },
  {
    id: 6,
    question: "Ako môžem platiť?",
    answer: "Kartou, prevodom alebo hotovosťou. Možné aj splátky."
  },
  {
    id: 7,
    question: "Majú vozidlá diaľničnú známku?",
    answer: "Áno, pre SK a CZ. Pre iné krajiny si zakúpte sami."
  }
];

export const InteractiveFaq = ({
  className,
  iconPxFilledTypeArrowSmall = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledImg = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall1 = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall2 = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall3 = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall4 = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall5 = "/assets/misc/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall6 = "/assets/misc/icon-24-px-filled-136.svg",
}: Props): JSX.Element => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const toggleItem = (id: number) => {
    const newExpandedItems = new Set(expandedItems);
    if (newExpandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  const getIconForIndex = (index: number) => {
    const icons = [
      iconPxFilledTypeArrowSmall,
      iconPxFilledImg,
      iconPxFilledTypeArrowSmall1,
      iconPxFilledTypeArrowSmall2,
      iconPxFilledTypeArrowSmall3,
      iconPxFilledTypeArrowSmall4,
      iconPxFilledTypeArrowSmall5,
      iconPxFilledTypeArrowSmall6,
    ];
    return icons[index] || iconPxFilledTypeArrowSmall;
  };

  return (
    <div
      className={`flex flex-col w-[360px] items-center gap-10 px-4 py-20 relative bg-colors-black-300 rounded-[24px_24px_0px_0px] overflow-hidden ${className}`}
    >
      <div className="flex flex-col items-center gap-2 relative self-stretch w-full flex-[0_0_auto]">
        <div className="flex flex-col items-center gap-[108px] relative self-stretch w-full flex-[0_0_auto]">
          <div className="relative w-fit mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-2xl text-center tracking-[0] leading-6 whitespace-nowrap">
            Časté otázky
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 relative self-stretch w-full flex-[0_0_auto]">
        {faqData.map((item, index) => {
          const isExpanded = expandedItems.has(item.id);
          return (
            <div
              key={item.id}
              className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
            >
              {/* Question Header */}
              <div 
                className="flex items-center justify-between pl-4 pr-2 py-4 relative self-stretch w-full cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                onClick={() => toggleItem(item.id)}
              >
                <div className="inline-flex items-center flex-[0_0_auto] gap-2 relative flex-1 pr-2">
                  <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-xs tracking-[0] leading-[16px]">
                    {item.question}
                  </p>
                </div>

                <div className={`transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                  <IconPxFilled
                    className="!relative !left-[unset] !top-[unset]"
                    type="arrow-small-down"
                    typeArrowSmall={getIconForIndex(index)}
                  />
                </div>
              </div>

                              {/* Answer Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-4 pb-3 pt-0">
                    <div className="w-full h-px bg-colors-black-500 mb-2"></div>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-xs tracking-[0] leading-[16px]">
                      {item.answer}
                    </p>
                  </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
