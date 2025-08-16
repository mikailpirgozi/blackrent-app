# Interaktívna Tabuľka Objednávky - Kompletný Archív

## 📋 Popis
Kompletná implementácia interaktívnej tabuľky objednávky pre BlackRent customer website s presnou implementáciou podľa Figma dizajnu.

## 🎯 Funkcionality
- **6 rôznych stavov** objednávky s plynulými prechodmi
- **Responzívny dizajn** pre breakpointy: 360px, 744px, 1440px, 1728px
- **Presné štýlovanie** podľa Figma exportu z Anima
- **Lokálne assets** - žiadne externé URL
- **TypeScript** s moderným React (funkčné komponenty, hooks)
- **TailwindCSS** pre štýlovanie

## 📁 Štruktúra súborov

### Komponenty
```
booking/
├── TabulkaObjednavky.tsx          # Hlavný komponent s orchestráciou stavov
├── types.ts                       # TypeScript typy pre booking stavy
└── sections/                      # Jednotlivé sekcie/stavy
    ├── TypDefaultSubsection.tsx   # Predvolený stav
    ├── TypInfoBoxSubsection.tsx   # Stav s info boxom
    ├── TypPoVyplnenSubsection.tsx # Stav po vyplnení (tlačidlo "Ďalšie služby")
    ├── TypPromoKdSubsection.tsx   # Stav s promo kódom
    ├── TypPromoKdFilledSubsection.tsx # Stav s vyplneným promo kódom
    └── TypShrnObjednvkySubsection.tsx # Súhrn objednávky (tlačidlo "Potvrdiť")
```

### Demo stránka
```
page.tsx                           # Demo stránka pre testovanie všetkých stavov
```

### Assets (všetky lokálne)
```
assets/
├── icon-16-px-*.svg              # 16px ikonky pre formuláre
├── icon-24-px-*.svg              # 24px ikonky pre tlačidlá
├── vector.svg                    # BlackRent logo
├── line-18-3.svg                 # Oddeľovacia čiara
├── check-boxy-24-5.svg           # Checkbox ikonka
├── arrow-right-24px.svg          # Arrow-right pre "Ďalšie služby"
└── car-image-mobile-4c02b7.png   # Obrázok auta (stiahnutý z Figma)
```

## 🎨 Dizajn špecifikácie

### Fonty
- **SF Pro**: Hlavný font pre väčšinu textu
- **Poppins**: Špeciálne pre tlačidlá (podľa Figma komponenty)

### Farby (presne podľa Figma)
- **Background**: `#0A0A0F`, `#141419`
- **Cards**: `#1E1E23`
- **Text**: `#F0F0F5`, `#A0A0A5`
- **Accent**: `#F0FF98`
- **Button**: `#D7FF14` s `#141900` textom

### Breakpointy
- **360px**: Mobile (single column, stacked elements)
- **744px**: Tablet (sm: prefix)
- **1440px**: Desktop (md: prefix)
- **1728px**: Large desktop

## 🔧 Technické detaily

### Stav management
- React `useState` hook pre lokálne stavy komponentov
- Centrálny `BookingState` type pre orchestráciu
- Callback funkcie pre komunikáciu medzi komponentmi

### Responzívnosť
- **Mobile (360px)**: Stĺpcový layout, menšie paddingy, stacked elementy
- **Tablet (744px)**: Hybridný layout
- **Desktop (1440px+)**: Plný row layout s optimálnymi rozmermi

### Interaktivita
- Klikateľné formulárové polia
- Expandovateľný promo kód
- Tooltip funkcionalita
- Smooth state transitions
- Hover efekty na tlačidlách

## 🚀 Použitie

### Základná implementácia
```tsx
import { TabulkaObjednavky } from './booking/TabulkaObjednavky';

function App() {
  return (
    <TabulkaObjednavky 
      initialState="default"
      onStateChange={(newState) => console.log('New state:', newState)}
    />
  );
}
```

### Dostupné stavy
- `"default"` - Predvolený stav
- `"info-box"` - S info boxom
- `"po-vyplneni"` - Po vyplnení (tlačidlo "Ďalšie služby")
- `"promo-kod"` - S promo kódom
- `"promo-kod-filled"` - S vyplneným promo kódom
- `"suhrn-objednavky"` - Súhrn objednávky (tlačidlo "Potvrdiť")

## ✅ Kontrola assets
Všetky assets sú **lokálne uložené** v `/assets/` priečinku:
- ✅ Žiadne externé URL
- ✅ Žiadne Figma CDN odkazy
- ✅ Žiadne third-party image servery
- ✅ Všetko je self-contained

## 📝 Poznámky
- Implementované presne podľa Figma dizajnu
- Zachované všetky Tailwind triedy z Anima exportu
- Optimalizované pre produkčné použitie
- Plne responzívne pre všetky zariadenia
- TypeScript pre type safety

## 🎉 Stav: KOMPLETNÉ
Všetky funkcionality implementované a otestované.
Pripravené na produkčné nasadenie.

---
**Vytvorené**: ${new Date().toLocaleDateString('sk-SK')}
**Verzia**: 1.0.0 - Final
**Status**: ✅ Production Ready
