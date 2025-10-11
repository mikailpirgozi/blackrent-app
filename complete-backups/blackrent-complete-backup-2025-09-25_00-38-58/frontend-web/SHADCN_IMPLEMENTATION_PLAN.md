# 🎨 SHADCN/UI IMPLEMENTAČNÝ PLÁN PRE BLACKRENT

## 📋 PREHĽAD PROJEKTU

**Cieľ**: Postupná migrácia z Material-UI + DaisyUI na shadcn/ui pre BlackRent aplikáciu

**Trvanie**: 3-4 týždne  
**Priorita**: Vysoká  
**Status**: Plánovanie

## 🔍 AKTUÁLNY STAV BLACKRENT
- ✅ **Material-UI** - hlavný UI framework (MUI v5)
- ✅ **DaisyUI** - Tailwind komponenty s Apple témou
- ✅ **Vlastný design system** - UnifiedButton, UnifiedCard, UnifiedChip
- ✅ **Aeonik font** - vlastný font implementovaný
- ✅ **Apple farby** - už implementované v DaisyUI téme  

---

## 🎯 FÁZA 1: INŠTALÁCIA A KONFIGURÁCIA (2-3 dni)

### 1.1 Inštalácia shadcn/ui
- [x] **Test projekt vytvorený** - shadcn-blackrent-test
- [x] **shadcn/ui komponenty otestované** - button, card, input, select, table, dialog
- [x] **Modrá téma implementovaná** - presne ako na ui.shadcn.com
- [ ] **Inštalácia do BlackRent projektu**
  ```bash
  cd apps/web
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card input select table dialog form badge avatar dropdown-menu sheet
  ```

### 1.2 Konfigurácia Tailwind CSS
- [ ] **Aktualizovať tailwind.config.js**
  - Pridať shadcn/ui konfiguráciu
  - Zachovať existujúce DaisyUI nastavenia
  - Nastaviť Inter font namiesto Aeonik

### 1.3 Analýza existujúcich komponentov
- [x] **Identifikované kľúčové komponenty**
  - UnifiedButton → shadcn/ui Button
  - UnifiedCard → shadcn/ui Card
  - UnifiedChip → shadcn/ui Badge
  - MUI TextField → shadcn/ui Input
  - MUI Select → shadcn/ui Select
  - MUI DataGrid → shadcn/ui Table

### 1.4 Migračná stratégia
- [ ] **Postupná migrácia** - jeden komponent za druhým
- [ ] **Zachovanie funkcionality** - všetky features musia fungovať
- [ ] **Rollback plán** - možnosť vrátiť sa späť
- [ ] **Testovanie** - po každom komponente test

---

## 🧪 FÁZA 2: TEST PROJEKT (Týždeň 2)

### 2.1 Vytvorenie test prostredia
```bash
# Vytvoriť nový test projekt
mkdir shadcn-blackrent-test
cd shadcn-blackrent-test
npm create vite@latest . -- --template react-ts
npm install

# Inštalácia Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Inštalácia shadcn/ui
npx shadcn-ui@latest init
```

### 2.2 Základné komponenty
```bash
# Pridať kľúčové komponenty
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add sheet
```

### 2.3 Apple-style téma
```typescript
// globals.css - Apple Colors
@layer base {
  :root {
    /* Apple System Colors */
    --background: 0 0% 100%;           /* White */
    --foreground: 0 0% 3.9%;           /* Black */
    
    --primary: 210 100% 50%;           /* Apple Blue #007AFF */
    --primary-foreground: 0 0% 98%;    /* White */
    
    --secondary: 262 83% 58%;          /* Apple Purple #5856D6 */
    --secondary-foreground: 0 0% 98%;  /* White */
    
    --accent: 0 84% 60%;               /* Apple Red #FF3B30 */
    --accent-foreground: 0 0% 98%;     /* White */
    
    --success: 142 76% 36%;            /* Apple Green #34C759 */
    --success-foreground: 0 0% 98%;    /* White */
    
    --warning: 38 92% 50%;             /* Apple Orange #FF9500 */
    --warning-foreground: 0 0% 98%;    /* White */
    
    --muted: 0 0% 96.1%;               /* Light Gray */
    --muted-foreground: 0 0% 45.1%;    /* Dark Gray */
    
    --border: 0 0% 89.8%;              /* Border Gray */
    --input: 0 0% 89.8%;               /* Input Border */
    --ring: 210 100% 50%;              /* Focus Ring */
  }
}
```

### 2.4 Test komponenty
- [ ] **Button variants** - primary, secondary, outline, ghost
- [ ] **Form elements** - input, select, checkbox, radio
- [ ] **Cards** - basic, with header, with footer
- [ ] **Tables** - striped, hover, sortable
- [ ] **Modals** - basic, with form, confirmation
- [ ] **Navigation** - sidebar, header, breadcrumbs

---

## 🎨 FÁZA 3: BLACKRENT PROTOTYP (Týždeň 3)

### 3.1 Header a Navigácia
```tsx
// Komponenty potrebné:
- Header s logo a navigáciou
- Sidebar s menu položkami
- Breadcrumbs pre navigáciu
- User menu s dropdown
- Search bar s autocomplete
```

### 3.2 Vozidlá sekcia
```tsx
// Komponenty potrebné:
- Grid layout pre vozidlá
- Card komponenty s obrázkami
- Filter sidebar
- Sort dropdown
- Pagination
- Modal s detailmi vozidla
```

### 3.3 Rezervačný formulár
```tsx
// Komponenty potrebné:
- Multi-step form
- Date picker
- Time picker
- Select s search
- Form validation
- Success/error states
```

### 3.4 Tabuľky a zoznamy
```tsx
// Komponenty potrebné:
- Data table s sorting
- Pagination
- Row selection
- Bulk actions
- Export functionality
- Inline editing
```

### 3.5 Dashboard a štatistiky
```tsx
// Komponenty potrebné:
- Stat cards
- Charts integration
- Progress bars
- KPI indicators
- Real-time updates
```

---

## 🔧 FÁZA 4: INTEGRÁCIA (Týždeň 4)

### 4.1 Inštalácia do BlackRent
```bash
# V BlackRent projekte
cd /path/to/blackrent/apps/web

# Inštalácia shadcn/ui
npx shadcn-ui@latest init

# Pridať komponenty
npx shadcn-ui@latest add button card input select table dialog form badge avatar dropdown-menu sheet
```

### 4.2 Konfigurácia
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'aeonik': ['Aeonik', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["blackrent-apple"],
  },
}
```

### 4.3 Migrácia komponentov
- [ ] **Postupná migrácia** - jeden komponent za druhým
- [ ] **Zachovanie funkcionality** - všetky features musia fungovať
- [ ] **Testovanie** - po každom komponente test
- [ ] **Rollback plán** - možnosť vrátiť sa späť

### 4.4 TypeScript integrácia
```typescript
// types/ui.ts
export interface BlackRentTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
  };
}
```

---

## 🧪 FÁZA 5: TESTOVANIE A OPTIMALIZÁCIA (Týždeň 5)

### 5.1 Funkčné testovanie
- [ ] **Unit testy** - všetky komponenty
- [ ] **Integration testy** - komponenty spolu
- [ ] **E2E testy** - celé user flows
- [ ] **Accessibility testy** - WCAG compliance
- [ ] **Performance testy** - bundle size, loading

### 5.2 UI/UX testovanie
- [ ] **Responsive design** - mobile, tablet, desktop
- [ ] **Cross-browser** - Chrome, Firefox, Safari, Edge
- [ ] **User testing** - feedback od používateľov
- [ ] **Design review** - zhoda s Apple dizajnom

### 5.3 Performance optimalizácia
- [ ] **Bundle analysis** - veľkosť balíkov
- [ ] **Code splitting** - lazy loading komponentov
- [ ] **Tree shaking** - odstránenie nepoužívaného kódu
- [ ] **Caching** - optimalizácia načítania

---

## 🚀 FÁZA 6: DEPLOYMENT A MONITORING (Týždeň 6)

### 6.1 Staging deployment
- [ ] **Staging environment** - testovanie v produkčnom prostredí
- [ ] **User acceptance testing** - finálne testovanie
- [ ] **Performance monitoring** - sledovanie metrík
- [ ] **Error tracking** - Sentry integrácia

### 6.2 Production deployment
- [ ] **Gradual rollout** - postupné nasadenie
- [ ] **Feature flags** - možnosť vypnúť features
- [ ] **Monitoring** - real-time sledovanie
- [ ] **Rollback plán** - rýchle vrátenie sa späť

### 6.3 Dokumentácia
- [ ] **Component library** - dokumentácia komponentov
- [ ] **Style guide** - pravidlá dizajnu
- [ ] **Developer guide** - ako používať komponenty
- [ ] **Migration guide** - postup migrácie

---

## 📊 KRITÉRIÁ ÚSPECHU

### Technické kritériá
- ✅ **Zero breaking changes** - všetka funkcionalita zachovaná
- ✅ **Performance improvement** - rýchlejšie načítanie
- ✅ **Bundle size reduction** - menší balík
- ✅ **TypeScript coverage** - 100% typov
- ✅ **Test coverage** - 90%+ pokrytie

### Dizajnové kritériá
- ✅ **Apple design compliance** - zhoda s Apple štýlom
- ✅ **Responsive design** - funguje na všetkých zariadeniach
- ✅ **Accessibility** - WCAG 2.1 AA compliance
- ✅ **User experience** - lepšia UX
- ✅ **Visual consistency** - konzistentný dizajn

### Business kritériá
- ✅ **User satisfaction** - pozitívny feedback
- ✅ **Development speed** - rýchlejšie vývoj
- ✅ **Maintenance** - ľahšia údržba
- ✅ **Scalability** - možnosť rozšírenia
- ✅ **Team adoption** - tím používa nové komponenty

---

## 🛠️ NÁSTROJE A ZDROJE

### Vývojové nástroje
- **shadcn/ui CLI** - `npx shadcn-ui@latest`
- **Tailwind CSS** - styling framework
- **TypeScript** - type safety
- **Vite** - build tool
- **React** - UI framework

### Testovacie nástroje
- **Vitest** - unit testing
- **Playwright** - E2E testing
- **Storybook** - component testing
- **Lighthouse** - performance testing
- **axe-core** - accessibility testing

### Monitoring nástroje
- **Sentry** - error tracking
- **Vercel Analytics** - performance monitoring
- **Bundle Analyzer** - bundle size analysis
- **Chrome DevTools** - debugging

---

## 📅 TIMELINE

| Týždeň | Fáza | Aktivity | Výstupy |
|--------|------|----------|---------|
| 1 | Preskúmanie | Dokumentácia, analýza, plánovanie | Analýza, plán |
| 2 | Test projekt | Vytvorenie test prostredia, komponenty | Funkčný test projekt |
| 3 | Prototyp | BlackRent prototyp s shadcn/ui | Kompletný prototyp |
| 4 | Integrácia | Migrácia do BlackRent, konfigurácia | Integrované komponenty |
| 5 | Testovanie | Funkčné, UI/UX, performance testy | Otestované riešenie |
| 6 | Deployment | Staging, production, monitoring | Nasadené riešenie |

---

## 🎯 ĎALŠIE KROKY

1. **Začať s Fázou 1** - preskúmať dokumentáciu
2. **Vytvoriť test projekt** - otestovať komponenty
3. **Vytvoriť prototyp** - BlackRent s shadcn/ui
4. **Rozhodnúť sa** - pokračovať s implementáciou
5. **Migrovať postupne** - jeden komponent za druhým

---

## 📞 PODPORA

- **shadcn/ui Discord** - komunita a podpora
- **GitHub Issues** - bug reports a feature requests
- **Dokumentácia** - oficiálna dokumentácia
- **Examples** - hotové príklady a templates

---

*Tento plán je živý dokument a bude aktualizovaný počas implementácie.*
