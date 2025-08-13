/*
We're constantly improving the code you see. 
Please share your feedback here: https://form.asana.com/?k=uvp-HPgd3_hyoXRBw1IcNg&d=1152665201300829
*/

"use client";

import React, { useState } from "react";
import { IconPxFilled } from "../IconPxFilled";

interface Props {
  type: "default";
  className: any;
  iconPxFilledTypeArrowSmall?: string;
  iconPxFilledImg?: string;
  iconPxFilledTypeArrowSmall1?: string;
  iconPxFilledTypeArrowSmall2?: string;
  iconPxFilledTypeArrowSmall3?: string;
  iconPxFilledTypeArrowSmall4?: string;
  iconPxFilledTypeArrowSmall5?: string;
  iconPxFilledTypeArrowSmall6?: string;
  iconPxFilledTypeArrowSmall7?: string;
  iconPxFilledTypeArrowSmall8?: string;
  iconPxFilledTypeArrowSmall9?: string;
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
    answer: "V cene prenájmu je zahrnuté základné poistenie vozidla, technická kontrola, servis a údržba vozidla. Taktiež je zahrnutá diaľničná známka pre Slovensko a Česko."
  },
  {
    id: 2,
    question: "V akom stave je vozidlo pri odovzdaní nájomcovi?",
    answer: "Všetky naše vozidlá sú pred odovzdaním dôkladne vyčistené, technicky skontrolované a majú plnú nádrž paliva. Vozidlo dostanete v perfektnom stave pripravené na cestu."
  },
  {
    id: 3,
    question: "Do ktorých krajín môžem s vozidlom vycestovať?",
    answer: "S našimi vozidlami môžete cestovať po celej Európskej únii bez obmedzení. Pre niektoré krajiny mimo EÚ je potrebné špeciálne povolenie."
  },
  {
    id: 4,
    question: "Môžem cestovať aj do krajín mimo Európskej Únie?",
    answer: "Áno, ale je potrebné vopred požiadať o špeciálne povolenie a môžu sa účtovať dodatočné poplatky. Kontaktujte nás pre viac informácií."
  },
  {
    id: 5,
    question: "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
    answer: "Áno, ponúkame službu prevzatia a odovzdania vozidla mimo otváracích hodín za príplatok. Je potrebné dohodnúť si termín vopred."
  },
  {
    id: 6,
    question: "Ako môžem platiť za prenájom vozidla?",
    answer: "Akceptujeme platby kartou (Visa, Mastercard), bankovým prevodom alebo hotovosťou. Pre dlhodobé prenájmy je možná platba na splátky."
  },
  {
    id: 7,
    question: "Majú vozidlá diaľničnú známku?",
    answer: "Áno, všetky naše vozidlá majú platnú diaľničnú známku pre Slovensko a Česko. Pre ostatné krajiny si známku zakúpte sami."
  },
  {
    id: 8,
    question: "Je možná preprava zvierat?",
    answer: "Preprava zvierat je možná, ale je potrebné to vopred nahlásiť. Za čistenie vozidla po preprave zvierat sa účtuje dodatočný poplatok."
  },
  {
    id: 9,
    question: "Ako mám postupovať keď viem, že budem meškať?",
    answer: "Okamžite nás kontaktujte telefonicky. Snažíme sa byť flexibilní, ale meškanie môže byť spoplatnené podľa nášho cenníka."
  },
  {
    id: 10,
    question: "Čo znamená jeden deň prenájmu?",
    answer: "Jeden deň prenájmu znamená 24-hodinové obdobie od času prevzatia vozidla. Napríklad ak si vozidlo prevezmete o 14:00, vrátiť ho musíte najneskôr o 14:00 nasledujúci deň."
  },
  {
    id: 11,
    question: "Čo ak dostanem pokutu?",
    answer: "Všetky pokuty a poplatky za porušenie dopravných predpisov znáša nájomca. Okrem sumy pokuty sa účtuje aj administratívny poplatok za vybavenie."
  }
];

export const InteractiveFaq744 = ({
  type,
  className,
  iconPxFilledTypeArrowSmall = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledImg = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall1 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall2 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall3 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall4 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall5 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall6 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall7 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall8 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
  iconPxFilledTypeArrowSmall9 = "https://c.animaapp.com/h23eak6p/img/icon-24-px-filled-136.svg",
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
      iconPxFilledTypeArrowSmall7,
      iconPxFilledTypeArrowSmall8,
      iconPxFilledTypeArrowSmall9,
    ];
    return icons[index] || iconPxFilledTypeArrowSmall;
  };

  return (
    <div
      className={`flex w-[744px] items-start justify-center gap-2 px-0 py-[120px] relative bg-colors-black-300 rounded-[40px_40px_0px_0px] overflow-hidden ${className}`}
    >
      <div className="inline-flex flex-col items-center gap-20 relative flex-[0_0_auto]">
        <div className="relative w-60 h-6 mt-[-1.00px] [font-family:'SF_Pro-ExpandedSemibold',Helvetica] font-normal text-colors-light-yellow-accent-700 text-[32px] text-center tracking-[0] leading-6 whitespace-nowrap">
          Časté otázky
        </div>

        <div className="flex flex-col w-[506px] items-start gap-4 relative flex-[0_0_auto]">
          {faqData.map((item, index) => {
            const isExpanded = expandedItems.has(item.id);
            return (
              <div
                key={item.id}
                className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-colors-black-600 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
              >
                {/* Question Header */}
                <div 
                  className="flex items-center justify-between pl-6 pr-4 py-5 relative self-stretch w-full cursor-pointer hover:bg-colors-black-500 transition-colors duration-200"
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                    <p className="relative w-fit mt-[-1.00px] [font-family:'Poppins',Helvetica] font-semibold text-colors-white-800 text-sm tracking-[0] leading-6">
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
                    isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-0">
                    <div className="w-full h-px bg-colors-black-500 mb-4"></div>
                    <p className="[font-family:'Poppins',Helvetica] font-normal text-colors-ligh-gray-800 text-sm tracking-[0] leading-6">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
