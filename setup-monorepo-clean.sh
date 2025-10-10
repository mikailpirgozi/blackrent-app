#!/bin/bash
set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     🚀 MONOREPO SETUP - BlackRent (Variant B)            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# KROK 1: Vytvoriť development branch
echo "📋 KROK 1: Vytváram development branch..."
git checkout shadcn-clean
git checkout -b development
echo "✅ Development branch vytvorený z shadcn-clean"
echo ""

# KROK 2: Organizácia priečinkov
echo "📂 KROK 2: Kontrola štruktúry projektu..."
echo ""
echo "Aktuálna štruktúra:"
echo "blackrent-monorepo/"
echo "├── apps/"
echo "│   ├── web/          (Admin aplikácia)"
echo "│   └── mobile/       (Mobilná aplikácia)"
echo "├── customer-website/ (Verejný web)"
echo "└── .git/"
echo ""

# KROK 3: Vytvoriť .gitignore pre monorepo
echo "🔒 KROK 3: Aktualizujem .gitignore..."
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
.pnp
.pnp.js
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz

# Testing
coverage/
.nyc_output

# Next.js
.next/
out/
build/
dist/

# Production
/build

# Misc
.DS_Store
*.pem
.env
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
lerna-debug.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Turborepo
.turbo

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Backups
*.backup
*.bak

# Cleanup scripts (môžeš zmazať neskôr)
cleanup-*.sh
GITIGNORE

git add .gitignore
git commit -m "🔧 Update .gitignore for monorepo" || echo "No changes to commit"
echo "✅ .gitignore aktualizovaný"
echo ""

# KROK 4: Vytvoriť README pre branch stratégiu
echo "📝 KROK 4: Vytváram dokumentáciu branch stratégie..."
cat > BRANCH_STRATEGY.md << 'BRANCH_DOC'
# 🌳 Branch Strategy - BlackRent Monorepo

## 📋 Branch Typy

### 1. **main** (Produkčný)
- **Účel:** Produkčná verzia aplikácie
- **Deploy:** Automaticky na Railway/Vercel
- **Pravidlá:**
  - ⛔ Žiadne direct commits
  - ✅ Len cez Pull Request z development
  - ✅ Musí prejsť CI/CD tests
  - ✅ Code review povinný

### 2. **development** (Development)
- **Účel:** Development/staging verzia
- **Deploy:** Dev server
- **Pravidlá:**
  - ✅ Merge z feature branchov
  - ✅ Testovanie pred merge do main
  - ✅ Môžeš commitovať priamo (menšie zmeny)

### 3. **feature/*** (Features)
- **Účel:** Nové funkcionality
- **Pravidlá:**
  - ✅ Vytvor z development
  - ✅ Merge späť do development
  - ✅ Zmaž po merge
- **Príklady:**
  - `feature/shadcn-migration`
  - `feature/new-dashboard`
  - `feature/payment-integration`

### 4. **fix/*** (Bugfixy)
- **Účel:** Oprava chýb
- **Pravidlá:**
  - ✅ Vytvor z development (alebo main ak hotfix)
  - ✅ Rýchle merge
  - ✅ Zmaž po merge
- **Príklady:**
  - `fix/login-validation`
  - `fix/date-format`

### 5. **hotfix/*** (Urgentné opravy)
- **Účel:** Kritické bugfixy v produkcii
- **Pravidlá:**
  - ⚡ Vytvor z main
  - ⚡ Merge do main A development
  - ⚡ Immediate deploy
- **Príklady:**
  - `hotfix/security-vulnerability`
  - `hotfix/critical-bug`

---

## 🔄 Workflow

### Nová feature:
```bash
# 1. Vytvor branch z development
git checkout development
git pull origin development
git checkout -b feature/moja-nova-feature

# 2. Pracuj na feature
git add .
git commit -m "feat: pridaná nová feature"

# 3. Push na GitHub
git push -u origin feature/moja-nova-feature

# 4. Vytvor Pull Request na GitHub (development ← feature)
# 5. Po review a merge, zmaž branch
git branch -D feature/moja-nova-feature
git push origin --delete feature/moja-nova-feature
```

### Bugfix:
```bash
# 1. Vytvor branch z development
git checkout development
git checkout -b fix/nazov-bugu

# 2. Oprav bug
git add .
git commit -m "fix: oprava bugu"

# 3. Push a PR
git push -u origin fix/nazov-bugu
# (Vytvor PR na GitHube)
```

### Deploy do produkcie:
```bash
# 1. Merge development → main (cez PR)
# 2. Automatický deploy na Railway/Vercel
# 3. Testuj produkciu
# 4. Ak OK → hotovo! Ak nie → hotfix
```

---

## 📊 Aktuálny Stav

### Existujúce branche:
- ✅ **development** - Aktuálna development verzia (ex shadcn-clean)
- ⏸️ **main** - Starší stav (bude aktualizovaný neskôr)
- 💾 **backup-shadcn-clean-20251002** - Bezpečnostný backup

### Najbližšie kroky:
1. Pracuj na development branchi
2. Vytváraj feature branche podľa potreby
3. Keď je všetko stable → merge do main
4. Zmaž backup branch (už nie je potrebný)

---

## 💡 Best Practices

1. **Commit messages:**
   - `feat:` - Nová feature
   - `fix:` - Bugfix
   - `docs:` - Dokumentácia
   - `style:` - Styling
   - `refactor:` - Refaktoring
   - `test:` - Testy
   - `chore:` - Maintenance

2. **Pull Requests:**
   - Vždy pridaj popisný title
   - Vysvetli čo sa zmenilo a prečo
   - Pridaj screenshots ak je UI zmena
   - Požiadaj o review

3. **Branch naming:**
   - Lowercase
   - Použiť pomlčky (nie podčiarkovníky)
   - Descriptive names
   - Príklady: `feature/user-dashboard`, `fix/login-error`

---

**Vytvorené:** 2. Október 2025  
**Posledná aktualizácia:** 2. Október 2025
BRANCH_DOC

git add BRANCH_STRATEGY.md
git commit -m "📝 Add branch strategy documentation" || echo "No changes"
echo "✅ Branch stratégia dokumentovaná"
echo ""

# KROK 5: Vytvoriť MONOREPO_STRUCTURE.md
echo "📝 KROK 5: Dokumentujem monorepo štruktúru..."
cat > MONOREPO_STRUCTURE.md << 'STRUCTURE_DOC'
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
STRUCTURE_DOC

git add MONOREPO_STRUCTURE.md
git commit -m "📁 Add monorepo structure documentation" || echo "No changes"
echo "✅ Monorepo štruktúra dokumentovaná"
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              ✅ MONOREPO SETUP DOKONČENÝ!                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Vytvorené:"
echo "  ✅ development branch"
echo "  ✅ BRANCH_STRATEGY.md"
echo "  ✅ MONOREPO_STRUCTURE.md"
echo "  ✅ Aktualizovaný .gitignore"
echo ""
echo "🌳 Aktuálne branche:"
git branch --list
echo ""
echo "📍 Momentálne si na: $(git branch --show-current)"
echo ""
