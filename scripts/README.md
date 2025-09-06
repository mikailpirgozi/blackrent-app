# 🚀 BlackRent ESLint Automation Scripts

Automatické skripty na hromadné opravovanie ESLint chýb v BlackRent projekte.

## 📊 Aktuálny stav
- **438 chýb** v 122 súboroch
- **50% any types**, **45% unused vars**, **4% React hooks**

## 🤖 Dostupné skripty

### 🚀 Master Script (ODPORÚČANÉ)
```bash
node scripts/eslint-master-fix.js
```
**Kompletný automatický workflow:**
- ✅ Automatický backup (git stash)
- ✅ Všetky opravy v správnom poradí
- ✅ Build testing pred a po
- ✅ Detailný report s výsledkami
- ✅ Recovery návod ak niečo zlyhá

**Očakávaný výsledok:** 438 → ~50 chýb (88% redukcia) za 15-20 minút

---

### 1. Bulk Fix Script
```bash
node scripts/eslint-bulk-fix.js
```
**Hromadné automatické opravy:**
- ESLint --fix automatické opravy
- any → unknown replacements
- Základné unused imports cleanup
- React hooks dependencies
- Before/after štatistiky

---

### 2. Smart Fix Script  
```bash
node scripts/eslint-smart-fix.js
```
**Inteligentné opravy s prioritizáciou:**
- Smart prioritizácia súborov (impact/effort ratio)
- Kontextuálne any type fixes
- Pokročilé unused imports removal
- React hooks intelligent detection
- Top 30 súborov automaticky

---

### 3. Specialized Fix Script
```bash
node scripts/eslint-specialized-fix.js
```
**Špecializované opravy podľa typu súboru:**
- **React komponenty:** event handlers, props, useState
- **Utility súbory:** API responses, error handling
- **Backend súbory:** database queries, request/response
- **Advanced unused imports:** AST-like analýza

---

## 🎯 Použitie

### ⚡ Super Quick Start
```bash
# Jeden príkaz na všetko (ODPORÚČANÉ)
node scripts/eslint-master-fix.js
```

### 🔧 Manuálny prístup
```bash
# Postupne spusti všetky skripty
node scripts/eslint-bulk-fix.js
node scripts/eslint-smart-fix.js  
node scripts/eslint-specialized-fix.js

# Finálna validácia
npx eslint . --ext .ts,.tsx --max-warnings=0
npm run build && cd backend && npm run build
```

## 📊 Očakávané výsledky

| Fáza | Pred | Po | Opravené | Čas |
|------|------|----|---------|----|
| Bulk Fix | 438 | ~250 | 188 (43%) | 5 min |
| Smart Fix | 250 | ~150 | 100 (40%) | 5 min |
| Specialized | 150 | ~50 | 100 (67%) | 5 min |
| **CELKOVO** | **438** | **~50** | **388 (88%)** | **15 min** |

## 🔄 Recovery

Ak niečo zlyhá:
```bash
# Vráť zmeny
git stash pop

# Alebo kompletný reset  
git checkout -- .
```

## 📄 Reporty

Skripty vytvárajú detailné reporty:
- `eslint-fix-report.json` - Bulk fix výsledky
- `eslint-master-fix-report.json` - Master script výsledky

## 🎯 Finálny cieľ

**0 ERRORS, 0 WARNINGS** za 2-3 hodiny celkovo:
- 15-20 min: Automatické opravy (88%)
- 1-2 hodiny: Manuálne dokončenie zostávajúcich komplexných chýb
