# 🚀 BlackRent Workspace Guide

## 📁 Štruktúra Projektu

```
Blackrent Beta 2/
├── apps/
│   ├── web/               ← 🌐 Web aplikácia (React + Vite)
│   └── mobile/            ← 📱 Mobilná aplikácia (React Native + Expo)
├── packages/              ← 📦 Zdieľané knižnice
│   ├── shared/
│   ├── tokens/
│   └── ui-native/
└── src-old-backup/        ← 🗂️ Starý kód (NEPOUŽÍVA SA)
```

## 🎯 Ako Správne Otvoriť Workspace v Cursor

### Pre Web Aplikáciu:
```bash
# Otvor len web aplikáciu
code apps/web/
```
**Alebo v Cursor:** File → Open Folder → `apps/web/`

### Pre Mobilnú Aplikáciu:
```bash
# Otvor len mobilnú aplikáciu  
code apps/mobile/
```
**Alebo v Cursor:** File → Open Folder → `apps/mobile/`

### Pre Celý Projekt (ak potrebuješ):
```bash
# Otvor celý monorepo (len ak musíš)
code .
```

## ⚠️ DÔLEŽITÉ PRAVIDLÁ

### ✅ SPRÁVNE:
- Edituj súbory v `apps/web/src/` pre web aplikáciu
- Edituj súbory v `apps/mobile/src/` pre mobilnú aplikáciu
- Spúšťaj príkazy z root adresára: `npm run dev:web` alebo `npm run dev:mobile`

### ❌ NIKDY:
- Needituj súbory v `src-old-backup/` (starý kód)
- Nespúšťaj `npm run dev` z `src-old-backup/`

## 🛠️ Príkazy

### Web Aplikácia:
```bash
# Z root adresára:
npm run dev:web              # Spustí web aplikáciu
npm run build:web            # Build web aplikácie

# Alebo z apps/web/:
cd apps/web
npm run dev                  # Spustí web aplikáciu
npm run build                # Build web aplikácie
```

### Mobilná Aplikácia:
```bash
# Z root adresára:
npm run dev:mobile           # Spustí mobilnú aplikáciu

# Alebo z apps/mobile/:
cd apps/mobile
npm run dev                  # Spustí mobilnú aplikáciu
```

## 🔍 Ako Identifikovať Správny Súbor

### Kontrola cesty:
```bash
pwd
# Musí byť:
# .../apps/web/src/...     ← Pre web aplikáciu
# .../apps/mobile/src/...  ← Pre mobilnú aplikáciu
# 
# NIE:
# .../src-old-backup/...   ← Starý kód!
```

### V Cursor:
- Pozri sa na cestu súboru v tab-e
- Musí začínať s `apps/web/` alebo `apps/mobile/`

## 🎯 Odporúčaný Workflow

1. **Otvor správny workspace:**
   - Pre web: `apps/web/`
   - Pre mobile: `apps/mobile/`

2. **Edituj súbory len v správnom priečinku**

3. **Testuj zmeny:**
   ```bash
   # Pre web:
   cd apps/web && npm run build
   
   # Pre mobile:
   cd apps/mobile && npm run build
   ```

4. **Commit a push**

## 🚨 Ak Sa Pomýliš

Ak omylom edituješ súbor v `src-old-backup/`:
1. **STOP** - nič neukladaj
2. Nájdi správny súbor v `apps/web/src/` alebo `apps/mobile/src/`
3. Skopíruj zmeny do správneho súboru
4. Ignoruj zmeny v `src-old-backup/`

---

**Pamätaj:** Vždy edituj súbory v `apps/` nie v `src-old-backup/`! 🎯
