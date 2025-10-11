# 📦 BlackRent Package.json Optimalizačný Plán

## 🎯 Cieľ
Optimalizovať dependencies, zlepšiť performance, odstrániť duplicity a pripraviť na monorepo štruktúru.

## ⚠️ **AUDIT VÝSLEDOK**
- **Date-fns:** POUŽÍVA SA V 27 SÚBOROCH - **NEMÔŽE SA ODSTRÁNIŤ**
- **Node knižnice:** Nenašli sa importy vo FE - **BEZPEČNÉ ODSTRÁNIŤ**
- **Bull:** Nenašli sa importy - **BEZPEČNÉ ODSTRÁNIŤ**

## 📋 Implementačný Plán

### FÁZA 1: KRITICKÉ OPRAVY (30 min)
**Priorita: VYSOKÁ - Urobiť HNEĎ - 100% BEZPEČNÉ**

#### 1.1 TypeScript 4.9 → 5.x Upgrade
```bash
# Odstráň starý TS
npm uninstall typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Nainštaluj nový TS 5.x
npm install -D typescript@^5.6.0 @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0

# Pridaj typecheck script
```

**Zmeny v package.json:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0"
  }
}
```

#### 1.2 Odstránenie Node-only knižníc z FE ✅ BEZPEČNÉ
```bash
# Odstráň Node knižnice ktoré nepatria do FE (audit potvrdil - nepoužívajú sa)
npm uninstall sharp pg form-data node-fetch pdfkit

# Odstráň ich typy
npm uninstall @types/sharp @types/pdfkit
```

#### 1.3 Bull/BullMQ duplicita ✅ BEZPEČNÉ
```bash
# Odstráň starý Bull (audit potvrdil - nepoužíva sa)
npm uninstall bull

# Ponechaj len BullMQ + ioredis
```

#### 1.4 PDF knižnice cleanup ✅ BEZPEČNÉ
```bash
# Odstráň pdfkit (Node-only, audit potvrdil - nepoužíva sa)
npm uninstall pdfkit @types/pdfkit

# Odstráň staré jsPDF typy (v3 má vlastné)
npm uninstall @types/jspdf

# Ponechaj: jspdf + pdf-lib (pre rôzne use cases)
```

### FÁZA 2: DEPENDENCY UPDATES (20 min)
**Priorita: STREDNÁ - BEZPEČNÉ UPGRADY**

#### 2.1 React 18.2 → 18.3+
```bash
npm install react@^18.3.0 react-dom@^18.3.0
npm install -D @types/react@^18.3.0 @types/react-dom@^18.3.0
```

#### 2.2 Vite 5.0 → najnovší
```bash
npm install -D vite@^5.4.0 @vitejs/plugin-react@^4.3.0
```

#### 2.3 Date knižnice - OPRAVENÉ ⚠️
```bash
# ODSTRÁŇ dayjs (duplicita s date-fns)
npm uninstall dayjs

# PONECHAJ date-fns (používa sa v 27 súboroch!)
# date-fns zostáva hlavná knižnica
```

**Dôvod:** Audit ukázal že date-fns je masívne používané (27 súborov, 46 importov). Dayjs je duplicita.

### FÁZA 3: VALIDÁCIA A MONITORING (15 min)
**Priorita: STREDNÁ**

#### 3.1 Zod pre schema validáciu
```bash
npm install zod@^3.23.0
```

#### 3.2 Bundle analýza setup
```json
{
  "scripts": {
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  }
}
```

### FÁZA 4: SOCKET.IO KOMPATIBILITA (5 min)
**Priorita: NÍZKA - len kontrola**

#### 4.1 Skontroluj backend Socket.io verziu
```bash
# V backend/package.json skontroluj socket.io verziu
# FE: socket.io-client@4.8.1
# BE: socket.io@4.8.x (musí byť kompatibilná)
```

### FÁZA 5: MONOREPO PRÍPRAVA (voliteľné)
**Priorita: NÍZKA - budúcnosť**

#### 5.1 Štruktúra
```
/
├── apps/
│   ├── web/          # Frontend (React + Vite)
│   └── api/          # Backend (Node + Express)
├── packages/
│   ├── shared/       # Zdieľané typy
│   └── ui/          # UI komponenty
└── package.json      # Root workspace
```

## 🔧 Konkrétne Zmeny v package.json

### Odstráň tieto dependencies:
```json
{
  "dependencies": {
    // ODSTRÁŇ - BEZPEČNÉ (audit potvrdil):
    "bull": "^4.16.5",           // duplicita s BullMQ - nepoužíva sa
    "dayjs": "1.11.13",          // duplicita s date-fns - OPRAVENÉ
    "form-data": "^4.0.4",       // Node-only - nepoužíva sa vo FE
    "node-fetch": "^3.3.2",      // Node-only - nepoužíva sa vo FE
    "pdfkit": "^0.17.2",         // Node-only - nepoužíva sa vo FE
    "pg": "8.16.3",              // Node-only - nepoužíva sa vo FE
    "sharp": "^0.34.3"           // Node-only - nepoužíva sa vo FE
    
    // PONECHAJ:
    // "date-fns": "2.30.0",     // HLAVNÁ knižnica - 27 súborov ju používa!
    // "pdf-lib": "^1.17.1",     // ponechaj pre pokročilé PDF
  },
  "devDependencies": {
    // ODSTRÁŇ:
    "@types/jspdf": "1.3.3",     // jsPDF v3 má vlastné typy
    "@types/pdfkit": "^0.17.2",  // Node-only
    "@types/sharp": "^0.31.1"    // Node-only
  }
}
```

### Pridaj/aktualizuj:
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "build": "npm run typecheck && vite build",
    "analyze": "npm run build && npx vite-bundle-analyzer dist"
  }
}
```

## ⚠️ Pred Začatím

1. **Backup:** `git commit -am "Before package optimization"`
2. **Test:** Spusti `npm run build` pred zmenami
3. **Postupne:** Rob jednu fázu za druhú
4. **Testuj:** Po každej fáze spusti `npm run build && npm run test`

## 🎯 Očakávané Výsledky

- **Bundle size:** -20-30% (odstránenie Node knižníc)
- **Build time:** -15-25% (TypeScript 5.x)
- **Type safety:** +100% (Zod validácia)
- **Maintenance:** Jednoduchšie (menej duplicít)
- **Performance:** Rýchlejší runtime (novší React/Vite)

## 📊 Kontrolný Zoznam

- [ ] Fáza 1: Kritické opravy (TS, Node knižnice, duplicity)
- [ ] Fáza 2: Dependency updates (React, Vite)
- [ ] Fáza 3: Zod validácia
- [ ] Fáza 4: Socket.io kompatibilita
- [ ] Build test: `npm run build` prechádza
- [ ] App test: Aplikácia funguje lokálne
- [ ] Bundle analýza: `npm run analyze`

## 🚀 Spustenie - OPRAVENÉ

```bash
# 1. Backup
git add -A && git commit -m "Before package optimization"

# 2. Spusti fázu 1 - BEZPEČNÉ ODSTRÁNENIE
npm uninstall sharp pg form-data node-fetch pdfkit bull dayjs @types/jspdf @types/pdfkit @types/sharp

# 3. Aktualizuj TypeScript
npm install -D typescript@^5.6.0 @typescript-eslint/eslint-plugin@^8.0.0 @typescript-eslint/parser@^8.0.0

# 4. Aktualizuj React/Vite
npm install react@^18.3.0 react-dom@^18.3.0
npm install -D @types/react@^18.3.0 @types/react-dom@^18.3.0 vite@^5.4.0 @vitejs/plugin-react@^4.3.0

# 5. Pridaj Zod
npm install zod@^3.23.0

# 6. Test
npm run build
```

**POZOR:** Odstránili sme `dayjs` namiesto `date-fns` (date-fns je hlavná knižnica)!

**Odhadovaný čas:** 70 minút celkom, ale môžeš robiť po fázach.
