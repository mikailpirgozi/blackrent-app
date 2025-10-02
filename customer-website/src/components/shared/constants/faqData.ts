// FAQ data extracted from ElementDetailVozidla
export interface FAQItem {
  question: string;
  answer: string;
}

export const faqData: { leftColumn: FAQItem[]; rightColumn: FAQItem[] } = {
  leftColumn: [
    {
      question: "Čo je zahrnuté v cene prenájmu?",
      answer: "V cene prenájmu je zahrnuté základné poistenie vozidla, neobmedzené kilometre v rámci Slovenska a základná technická podpora. Nie sú zahrnuté palivá, diaľničné známky a dodatočné poistenie."
    },
    {
      question: "V akom stave je vozidlo pri odovzdaní nájomcovi?",
      answer: "Všetky vozidlá sú pred odovzdaním dôkladne vyčistené a technicky skontrolované. Vozidlo dostanete s plnou nádržou paliva a v bezchybnom technickom stave."
    },
    {
      question: "Do ktorých krajín môžem s vozidlom vycestovať?",
      answer: "Základný balík umožňuje cestovanie po Slovensku, Česku a Rakúsku. Za príplatok môžete rozšíriť na ďalšie krajiny EÚ."
    },
    {
      question: "Môžem cestovať aj do krajín mimo Európskej Únie?",
      answer: "Cestovanie mimo EÚ je možné po individuálnom posúdení a schválení. Kontaktujte nás pre viac informácií o podmienkach."
    },
    {
      question: "Môžem vozidlo prevziať / odovzdať aj mimo otváracích hodín?",
      answer: "Áno, ponúkame službu prevzatia a odovzdania vozidla mimo otváracích hodín za príplatok 20€. Službu je potrebné dohodnúť vopred."
    },
    {
      question: "Ako môžem platiť za prenájom vozidla?",
      answer: "Akceptujeme platby kreditnou kartou, bankovým prevodom alebo hotovosťou. Depozit je možné zložiť len kreditnou kartou."
    }
  ],
  rightColumn: [
    {
      question: "Majú vozidlá diaľničnú známku?",
      answer: "Áno, všetky naše vozidlá majú platnú diaľničnú známku pre Slovensko. Pre ostatné krajiny si diaľničné známky zabezpečte sami."
    },
    {
      question: "Je možná preprava zvierat?",
      answer: "Preprava zvierat je povolená za dodržania hygienických podmienok. Za dodatočné čistenie vozidla účtujeme poplatok 50€."
    },
    {
      question: "Ako mám postupovať keď viem, že budem meškať?",
      answer: "Okamžite nás kontaktujte na +421 910 666 949. Meškanie do 1 hodiny je bez poplatku, každá ďalšia hodina je spoplatnená 10€."
    },
    {
      question: "Čo znamená jeden deň prenájmu?",
      answer: "Jeden deň prenájmu predstavuje 24-hodinové obdobie od času prevzatia vozidla. Prekročenie času je spoplatnené ako ďalší deň."
    },
    {
      question: "Čo ak dostanem pokutu?",
      answer: "Všetky pokuty a poplatky počas prenájmu znáša nájomca. Administratívny poplatok za vybavenie pokuty je 25€."
    },
    {
      question: "Aké sú podmienky stornácie rezervácie?",
      answer: "Rezerváciu môžete zrušiť do 24 hodín pred začiatkom prenájmu bez poplatku. Pri neskoršom zrušení účtujeme 50% z ceny prenájmu."
    }
  ]
};
