# 📁 BlackRent Monorepo Structure

## 🏗️ Organizácia Projektu

```
blackrent-monorepo/
├── apps/
│   ├── web/                    # Admin web aplikácia (React + Vite)
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                 # Mobilná aplikácia (React Native + Expo)
│       ├── src/
│       ├── package.json
│       └── app.json
│
├── customer-website/           # Verejný web (Next.js)
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/
│   │   └── styles/
│   ├── public/
│   └── package.json
│
├── packages/                   # Zdieľané balíčky (budúcnosť)
│   ├── shared-types/          # TypeScript typy
│   ├── shared-utils/          # Utility funkcie
│   └── ui-components/         # Zdieľané UI komponenty
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│
├── docs/                      # Dokumentácia
│   ├── BRANCH_STRATEGY.md
│   ├── MONOREPO_STRUCTURE.md
│   └── ...
│
├── scripts/                   # Build & deploy skripty
│
├── .gitignore
├── package.json               # Root package.json
└── README.md
```

---

## 🎯 Účel Každého Projektu

### 1. **apps/web/** - Admin Aplikácia
**Tech Stack:**
- React 18.3
- Vite 6.0
- shadcn/ui
- React Query
- Zustand

**Používatelia:**
- Zamestnanci BlackRent
- Administrátori

**Funkcionalita:**
- Správa vozidiel
- Rezervácie
- Faktúry
- Protokoly
- Štatistiky

**Deploy:** Railway

---

### 2. **apps/mobile/** - Mobilná Aplikácia
**Tech Stack:**
- React Native
- Expo SDK 53
- React Navigation

**Používatelia:**
- Zamestnanci BlackRent (terén)
- Možno zákazníci (budúcnosť)

**Funkcionalita:**
- Handover/Return protokoly
- Fotografie vozidiel
- Podpisy
- Offline mode

**Deploy:** Expo EAS Build → App Store/Play Store

---

### 3. **customer-website/** - Verejný Web
**Tech Stack:**
- Next.js 15
- Tailwind CSS
- Figma designs

**Používatelia:**
- Verejnosť
- Potenciálni zákazníci

**Funkcionalita:**
- Homepage
- Ponuka vozidiel
- Kontakt
- O nás
- Služby

**Deploy:** Vercel

---

## 📦 Zdieľaný Kód (Budúcnosť)

### packages/shared-types/
```typescript
// Príklad:
export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  // ...
}

export interface Rental {
  id: string;
  vehicleId: string;
  // ...
}
```

**Používajú:**
- apps/web
- apps/mobile
- customer-website (ak potrebuje)

---

### packages/shared-utils/
```typescript
// Príklad:
export const formatPrice = (cents: number) => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR'
  }).format(cents / 100);
};
```

**Používajú:**
- Všetky projekty

---

## 🚀 Build & Deploy

### Development:
```bash
# Spustiť všetky projekty naraz:
npm run dev

# Alebo jednotlivo:
cd apps/web && npm run dev
cd customer-website && npm run dev
cd apps/mobile && npm start
```

### Production Build:
```bash
# Admin web:
cd apps/web && npm run build

# Customer website:
cd customer-website && npm run build

# Mobile:
cd apps/mobile && eas build
```

---

## 🔗 Výhody Monorepo

✅ **Zdieľaný kód** - Typy, utils, komponenty  
✅ **Konzistentné verzie** - Všetky projekty sync  
✅ **Jednoduchšia údržba** - Jedno miesto  
✅ **Koordinované releases** - Deploy spolu  
✅ **Reusability** - DRY princíp

---

## 📝 Ďalšie Kroky

### Teraz:
- [x] Základná štruktúra existuje
- [x] Všetky projekty funkčné
- [x] Git cleanup hotový

### Neskôr (voliteľné):
- [ ] Pridať Turborepo (rýchlejšie buildy)
- [ ] Vytvoriť packages/ pre shared code
- [ ] Setup Changesets (verzovanie)
- [ ] Unified testing setup
- [ ] Monorepo CI/CD optimalizácia

---

**Vytvorené:** 2. Október 2025
