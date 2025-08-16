# BlackRent Interaktívne Komponenty - Kompletný Archív

## 📋 Popis
Kompletná kolekcia všetkých interaktívnych komponentov pre BlackRent customer website s presnou implementáciou podľa Figma dizajnu.

## 🎯 Obsah archívu

### 1. 📋 **Interaktívna Tabuľka Objednávky** (`/tabulka-objednavky/`)
- **6 rôznych stavov** objednávky s plynulými prechodmi
- **Responzívny dizajn** pre všetky breakpointy (360px, 744px, 1440px, 1728px)
- **Presné tlačidlá**: "Ďalšie služby" (po vyplnení) + "Potvrdiť" (súhrn)
- **Lokálne assets** - obrázok auta stiahnutý z Figma
- **TypeScript** s moderným React

#### Komponenty:
```
booking/
├── TabulkaObjednavky.tsx          # Hlavný orchestračný komponent
├── types.ts                       # TypeScript typy
└── sections/                      # 6 stavov objednávky
    ├── TypDefaultSubsection.tsx   # Predvolený stav
    ├── TypInfoBoxSubsection.tsx   # Info box stav
    ├── TypPoVyplnenSubsection.tsx # Po vyplnení ("Ďalšie služby")
    ├── TypPromoKdSubsection.tsx   # Promo kód
    ├── TypPromoKdFilledSubsection.tsx # Vyplnený promo kód
    └── TypShrnObjednvkySubsection.tsx # Súhrn ("Potvrdiť")
```

### 2. 🧭 **Interaktívny Navbar** (`/navbar/`)
- **Menu komponenty** s dropdown funkcionalitou
- **Responzívne menu** pre mobile a desktop
- **Hover efekty** a smooth transitions
- **Presné štýlovanie** podľa Figma

#### Komponenty:
```
navbar/
├── Menu/                          # Hlavné menu
├── Menu1/                         # Alternatívne menu
└── SekcieVMenuBlack/             # Menu sekcie
```

### 3. ❓ **FAQ + Rýchly Kontakt** (`/faq-rychly-kontakt/`)
- **Expandovateľné FAQ** sekcie
- **Rýchly kontakt** formulár
- **Responzívne verzie** pre rôzne breakpointy
- **Smooth animácie** pri otváraní/zatváraní

#### Komponenty:
```
faq-rychly-kontakt/
├── Faq/                          # FAQ komponent
├── Faq744/                       # FAQ pre 744px
├── FaqRychlyKontakt/             # Kombinovaný FAQ + kontakt
├── FaqRychlyKontaktFooter1728/   # Footer verzia pre 1728px
├── RychlyKontakt/                # Rýchly kontakt
└── RychlyKontaktMobil/           # Mobile verzia
```

### 4. 🦶 **Footer 1728px** (`/footer-1728/`)
- **Kompletný footer** pre desktop (1728px)
- **Všetky sekcie**: linky, kontakt, social media
- **Under-footer** komponenty
- **Presné rozloženie** podľa Figma

#### Komponenty:
```
footer-1728/
├── Footer/                       # Hlavný footer
├── FooterTablet/                 # Tablet verzia
├── FooterWrapper/                # Footer wrapper
├── UnderFooter/                  # Pod-footer
├── UnderFooter1/                 # Alternatívny pod-footer
└── UnderFooter2/                 # Ďalšia verzia
```

### 5. 🔗 **Shared Komponenty** (`/shared-components/`)
- **Znovupoužiteľné komponenty** pre celý web
- **FAQ, Footer, Navbar** abstrakcie
- **Responzívne wrappery**
- **Utility komponenty**

#### Komponenty:
```
shared-components/
├── FAQ/                          # FAQ abstrakcia
├── MainFooter/                   # Hlavný footer
├── PageFooter/                   # Stránkový footer
├── QuickContact/                 # Rýchly kontakt
├── ResponsiveFooter/             # Responzívny footer
├── ResponsiveHeader/             # Responzívny header
├── CopyrightBar/                 # Copyright lišta
└── constants/                    # Dátové konštanty
    ├── faqData.ts               # FAQ dáta
    └── footerData.ts            # Footer dáta
```

### 6. 🎨 **Assets** (`/assets/`)
- **Všetky lokálne assets** - žiadne externé URL
- **Ikonky**: 16px, 24px, 32px verzie
- **Obrázky**: car images, logos, backgrounds
- **SVG súbory**: všetky vektory a ikony

## 🎨 Dizajn špecifikácie

### Fonty
- **SF Pro**: Jediné používané písmo pre celú aplikáciu (naše vlastné písmo)

### Farby (presne podľa Figma)
- **Background**: `#05050A`, `#0A0A0F`, `#141419`
- **Cards**: `#1E1E23`
- **Text**: `#F0F0F5`, `#A0A0A5`
- **Accent**: `#F0FF98`
- **Button**: `#D7FF14` s `#141900` textom

### Breakpointy
- **360px**: Mobile (single column)
- **744px**: Tablet (sm: prefix)
- **1440px**: Desktop (md: prefix)
- **1728px**: Large desktop

## 🚀 Nasadenie

### 1. Tabuľka objednávky na homepage
```tsx
import { TabulkaObjednavky } from "../components/booking/TabulkaObjednavky";

// V homepage
<section className="px-4 md:px-8 flex justify-center">
  <TabulkaObjednavky 
    initialState="default"
    onStateChange={(newState) => console.log('Booking state:', newState)}
  />
</section>
```

### 2. Navbar implementácia
```tsx
import { ResponsiveHeader } from "../components/shared/ResponsiveHeader";

// V layout
<ResponsiveHeader />
```

### 3. Footer implementácia
```tsx
import { ResponsiveFooter } from "../components/shared/ResponsiveFooter";

// V layout
<ResponsiveFooter />
```

### 4. FAQ + Rýchly kontakt
```tsx
import { FAQ } from "../components/shared/FAQ";
import { QuickContact } from "../components/shared/QuickContact";

// Na stránke
<FAQ />
<QuickContact />
```

## 🔧 Technické detaily

### Stav management
- **React hooks** pre lokálne stavy
- **TypeScript** pre type safety
- **Callback pattern** pre komunikáciu medzi komponentmi

### Responzívnosť
- **TailwindCSS** breakpointy
- **Mobile-first** prístup
- **Flexbox/Grid** layouts

### Interaktivita
- **Hover efekty** na všetkých interaktívnych prvkoch
- **Smooth transitions** medzi stavmi
- **Touch-friendly** pre mobile zariadenia
- **Keyboard navigation** support

## ✅ Kontrola assets
- ✅ **Žiadne externé URL** - všetko lokálne
- ✅ **Žiadne Figma CDN** odkazy
- ✅ **Self-contained** - funguje offline
- ✅ **Optimalizované obrázky** (WebP, PNG)

## 📱 Responzívnosť
- ✅ **360px**: Mobile layout
- ✅ **744px**: Tablet layout  
- ✅ **1440px**: Desktop layout
- ✅ **1728px**: Large desktop layout

## 🎉 Stav: KOMPLETNÉ
Všetky interaktívne komponenty implementované a otestované.
Pripravené na produkčné nasadenie.

---
**Vytvorené**: ${new Date().toLocaleDateString('sk-SK')}
**Verzia**: 1.1.0 - SF Pro Only (bez Poppins)
**Status**: ✅ Production Ready

## 🔄 Changelog v1.1.0
- ✅ **Odstránené Poppins písmo** - používa sa len naše SF Pro
- ✅ **Aktualizovaný tailwind.config.ts** - bez Poppins definície
- ✅ **Aktualizovaný globals.css** - bez Poppins importu
- ✅ **Opravené všetky komponenty** - font-poppins → font-sf-pro

## 📦 Nasadenie na homepage
Tabuľka objednávky je už nasadená na hlavnú stránku medzi Featured Items a Reviews sekciou.
Prístupná na: `http://localhost:3002/`
