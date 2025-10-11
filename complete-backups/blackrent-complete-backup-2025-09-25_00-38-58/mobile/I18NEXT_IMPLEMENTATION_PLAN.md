# 🌍 i18next + react-i18next + expo-localization Implementation Plan

## Migrácia z AI Translation na i18next systém pre BlackRent Mobile

---

## 📋 **OVERVIEW**

**Cieľ:** Nahradiť aktuálny AI Translation systém s **i18next + react-i18next + expo-localization** pre:
- ⚡ **Rýchlejšie** prepínanie jazykov (žiadne API volania)
- 🔄 **Offline** funkcionalita
- 📱 **Auto-detekcia** jazyka z telefónu
- 🎯 **Štandardné** riešenie pre React Native
- 💰 **Bez nákladov** na API volania

---

## 🏗️ **AKTUÁLNY STAV**

### **✅ Už implementované:**
- ✅ `i18next` (v25.5.2) - nainštalované
- ✅ `react-i18next` (v13.5.0) - nainštalované  
- ✅ `expo-localization` (v16.1.6) - nainštalované
- ✅ Translation súbory v `src/i18n/locales/` (sk, en, de, cz)
- ✅ i18n konfigurácia v `src/i18n/index.ts`
- ✅ Custom hook `src/hooks/use-translation.ts`
- ✅ i18n inicializácia v `src/app/_layout.tsx`

### **❌ Čo treba opraviť:**
- ❌ Profile.tsx používa AI Translation namiesto i18next
- ❌ Ostatné komponenty používajú AI Translation
- ❌ Duplicitný translation systém (AI + i18next)
- ❌ Chýbajú preklady v JSON súboroch
- ❌ Nepoužíva sa expo-localization auto-detekcia

---

## 🚀 **IMPLEMENTAČNÝ PLÁN**

### **FÁZA 1: Príprava translation súborov** ⏱️ 30 min

#### **1.1 Rozšíriť JSON súbory**
```bash
# Aktualizovať všetky translation súbory
src/i18n/locales/sk.json  # ✅ Už má základné preklady
src/i18n/locales/en.json  # ✅ Už má základné preklady  
src/i18n/locales/de.json  # ✅ Už má základné preklady
src/i18n/locales/cz.json  # ✅ Už má základné preklady
```

#### **1.2 Pridať chýbajúce kľúče**
```json
{
  "common": {
    "selectLanguage": "Vyberte jazyk",
    "close": "Zavrieť"
  },
  "profile": {
    "personalInfo": "Osobné údaje",
    "myBookings": "Moje rezervácie", 
    "language": "Jazyk a preklad",
    "support": "Podpora"
  }
}
```

### **FÁZA 2: Aktualizovať i18n konfiguráciu** ⏱️ 15 min

#### **2.1 Pridať auto-detekciu jazyka**
```typescript
// src/i18n/index.ts
import * as Localization from 'expo-localization';

const deviceLocale = Localization.getLocales()[0]?.languageCode || 'sk';
const supportedLocale = deviceLocale in supportedLanguages ? deviceLocale : 'sk';

i18n.use(initReactI18next).init({
  lng: supportedLocale, // Auto-detekcia z telefónu
  fallbackLng: 'sk',
  // ...
});
```

#### **2.2 Pridať Hungarian support**
```typescript
// Pridať maďarčinu
import hu from './locales/hu.json';

export const supportedLanguages = {
  sk: 'Slovenčina',
  en: 'English', 
  de: 'Deutsch',
  cz: 'Čeština',
  hu: 'Magyar', // ← Pridať
} as const;
```

### **FÁZA 3: Migrovať komponenty** ⏱️ 45 min

#### **3.1 Aktualizovať Profile.tsx**
```typescript
// Nahradiť:
import { useAITranslation } from '../../contexts/TranslationContext';

// S:
import { useTranslation } from '../../hooks/use-translation';

// Nahradiť:
const getText = (key: string, fallback: string) => { ... }

// S:
const { t, changeLanguage, getCurrentLanguage } = useTranslation();

// Nahradiť:
title: getText('profile.personalInfo', 'Osobné údaje'),

// S:
title: t('profile.personalInfo'),
```

#### **3.2 Vytvoriť nový LanguageSwitcher**
```typescript
// src/components/ui/language-switcher-i18n.tsx
import { useTranslation } from '../../hooks/use-translation';

export function LanguageSwitcherI18n() {
  const { changeLanguage, getCurrentLanguage } = useTranslation();
  
  const handleLanguageChange = async (lang: string) => {
    await changeLanguage(lang);
  };
  
  // Jednoduchý modal s jazykmi
}
```

#### **3.3 Migrovať ostatné komponenty**
```bash
# Komponenty na migráciu:
- src/app/(tabs)/*.tsx
- src/app/auth/*.tsx  
- src/app/booking/*.tsx
- src/components/ui/*.tsx
```

### **FÁZA 4: Odstránenie AI Translation** ⏱️ 30 min

#### **4.1 Odstrániť AI Translation súbory**
```bash
# Súbory na odstránenie:
- src/contexts/TranslationContext.tsx
- src/services/ai-translation-service.ts
- src/components/ui/language-switcher/language-switcher.tsx
```

#### **4.2 Vyčistiť importy**
```bash
# Odstrániť zo všetkých súborov:
import { useAITranslation } from '../contexts/TranslationContext';
import { TranslationProvider } from '../contexts/TranslationContext';
```

#### **4.3 Aktualizovať _layout.tsx**
```typescript
// Odstrániť:
import { TranslationProvider } from '../contexts/TranslationContext';

// Ponechať len:
import '../i18n'; // i18next inicializácia
```

### **FÁZA 5: AI preklad JSON súborov** ⏱️ 20 min

#### **5.1 Použiť OpenAI na preklad**
```bash
# Preložiť sk.json → en.json, de.json, cz.json, hu.json
# Jednorazovo cez OpenAI API
# Skontrolovať kvalitu prekladov
```

#### **5.2 Validácia prekladov**
```bash
# Skontrolovať:
- Všetky kľúče existujú vo všetkých jazykoch
- Preklady sú správne a kontextové
- Interpolácie fungujú ({{price}}, {{count}})
```

---

## 🔧 **TECHNICKÁ IMPLEMENTÁCIA**

### **Nová štruktúra:**
```
src/
├── i18n/
│   ├── index.ts           # ✅ i18next konfigurácia
│   └── locales/
│       ├── sk.json        # ✅ Slovenčina (primárny)
│       ├── en.json        # ✅ Angličtina  
│       ├── de.json        # ✅ Nemčina
│       ├── cz.json        # ✅ Čeština
│       └── hu.json        # ➕ Maďarčina (pridať)
├── hooks/
│   └── use-translation.ts # ✅ Custom hook
└── components/
    └── ui/
        └── language-switcher-i18n.tsx # ➕ Nový switcher
```

### **Použitie v komponentoch:**
```typescript
import { useTranslation } from '../hooks/use-translation';

function MyComponent() {
  const { t, changeLanguage, formatCurrency } = useTranslation();
  
  return (
    <View>
      <Text>{t('common.loading')}</Text>
      <Text>{t('vehicle.pricePerDay', { price: 50 })}</Text>
      <Text>{formatCurrency(50)}</Text>
    </View>
  );
}
```

---

## ✅ **VÝHODY NOVÉHO SYSTÉMU**

### **Performance:**
- ⚡ **Okamžité** prepínanie jazykov (0ms vs 2000ms)
- 📱 **Offline** funkcionalita
- 🚀 **Žiadne API volania** pri prepínaní

### **User Experience:**
- 🔄 **Auto-detekcia** jazyka z telefónu
- 💾 **Perzistentné** nastavenie jazyka
- 🌍 **Štandardné** správanie (ako ostatné aplikácie)

### **Developer Experience:**
- 📝 **TypeScript** podpora s auto-complete
- 🔧 **Jednoduché** pridávanie nových textov
- 🧪 **Testovateľné** (bez API závislostí)
- 📊 **Interpolácie** a pluralizácia

### **Náklady:**
- 💰 **Žiadne náklady** na OpenAI API volania
- 🔋 **Nižšia spotreba** batérie
- 📶 **Funguje bez internetu**

---

## 🎯 **AKČNÝ PLÁN - KROK ZA KROKOM**

### **Krok 1: Príprava (10 min)**
```bash
# 1. Vytvoriť hu.json súbor
# 2. Skopírovať štruktúru z sk.json
# 3. Preložiť texty do maďarčiny
```

### **Krok 2: Konfigurácia (15 min)**
```bash
# 1. Aktualizovať src/i18n/index.ts
# 2. Pridať auto-detekciu jazyka
# 3. Pridať Hungarian support
```

### **Krok 3: Profile migrácia (20 min)**
```bash
# 1. Nahradiť AI Translation s useTranslation
# 2. Aktualizovať všetky texty na t() funkcie
# 3. Otestovať prepínanie jazykov
```

### **Krok 4: Ostatné komponenty (30 min)**
```bash
# 1. Migrovať tab komponenty
# 2. Migrovať auth komponenty  
# 3. Migrovať UI komponenty
```

### **Krok 5: Cleanup (15 min)**
```bash
# 1. Odstrániť AI Translation súbory
# 2. Vyčistiť importy
# 3. Aktualizovať _layout.tsx
```

### **Krok 6: Testovanie (20 min)**
```bash
# 1. Otestovať všetky jazyky
# 2. Otestovať auto-detekciu
# 3. Otestovať offline funkcionalitu
```

---

## 🚨 **POTENCIÁLNE PROBLÉMY A RIEŠENIA**

### **Problém 1: Chýbajúce preklady**
```bash
# Riešenie: Fallback na slovenčinu
fallbackLng: 'sk'
```

### **Problém 2: Interpolácie nefungujú**
```bash
# Riešenie: Správny formát v JSON
"pricePerDay": "€{{price}}/deň"
```

### **Problém 3: Pluralizácia**
```bash
# Riešenie: i18next plurals
"item_one": "{{count}} položka"
"item_few": "{{count}} položky"  
"item_many": "{{count}} položiek"
```

---

## 🎉 **OČAKÁVANÉ VÝSLEDKY**

### **Po implementácii:**
- ✅ **Okamžité** prepínanie jazykov
- ✅ **Auto-detekcia** jazyka z telefónu
- ✅ **Offline** funkcionalita
- ✅ **Žiadne API náklady**
- ✅ **Štandardné** React Native riešenie
- ✅ **5 jazykov** podporovaných (SK, EN, DE, CZ, HU)

### **Metriky:**
- 🚀 **Rýchlosť:** 0ms vs 2000ms (100x rýchlejšie)
- 💰 **Náklady:** $0 vs $50/mesiac OpenAI
- 📱 **UX:** Štandardné správanie ako ostatné aplikácie
- 🔧 **DX:** Jednoduchšie pridávanie textov

---

## 📝 **ZÁVER**

Migrácia na **i18next + react-i18next + expo-localization** je **najlepšie riešenie** pre BlackRent mobilnú aplikáciu:

1. **Rýchlejšie** - okamžité prepínanie
2. **Lacnejšie** - žiadne API náklady  
3. **Spoľahlivejšie** - offline funkcionalita
4. **Štandardnejšie** - priemyselný štandard
5. **Jednoduchšie** - ľahšie na údržbu

**Odhadovaný čas implementácie: 2-3 hodiny**
**ROI: Okamžitý** (úspora nákladov + lepší UX)
