# 🔧 Vite Troubleshooting Guide

Kompletný sprievodca riešením Vite problémov v BlackRent aplikácii.

## 🚨 Bežné Vite problémy a riešenia

### 1. **HMR (Hot Module Replacement) nefunguje**

**Príznaky:**
- Stránka sa neobnoví po zmene kódu
- Nekonečný reload loop
- Komponenty sa renderujú duplicitne

**Riešenie:**
```bash
npm run vite:cache    # Vyčisti cache
npm run daemon:restart # Reštart aplikácie
```

### 2. **Port konflikty**

**Príznaky:**
- "Port 3000 is already in use"
- Frontend sa spustí na porte 3001
- API nereaguje

**Riešenie:**
```bash
npm run vite:check    # Skontroluj porty
npm run cleanup       # Vyčisti porty
npm run daemon:restart
```

### 3. **Import/Module chyby**

**Príznaky:**
- "Failed to resolve import"
- "Module not found"
- Build funguje, dev nie

**Riešenie:**
```bash
# Skontroluj importy
npm run vite:check

# Oprav importy - pridaj extensions:
import Component from './Component'     # ❌
import Component from './Component.tsx' # ✅
```

### 4. **Environment Variables nefungujú**

**Príznaky:**
- `process.env.API_URL` je undefined
- Premenné nie sú dostupné v browseri

**Riešenie:**
```bash
# V .env.local použij VITE_ prefix:
VITE_API_URL=http://localhost:3001  # ✅
API_URL=http://localhost:3001       # ❌

# V kóde:
import.meta.env.VITE_API_URL        # ✅
process.env.API_URL                 # ❌
```

### 5. **Build vs Development rozdiely**

**Príznaky:**
- `npm run dev` funguje
- `npm run build` zlyháva
- Produkcia má iné správanie

**Riešenie:**
```bash
# Testuj build lokálne:
npm run build
npm run preview

# Skontroluj build warnings:
npm run build 2>&1 | grep -i warning
```

### 6. **CSS/Styling problémy**

**Príznaky:**
- Štýly sa nenačítajú
- CSS sa aplikuje nesprávne
- Tailwind nefunguje

**Riešenie:**
```bash
npm run vite:cache    # Vyčisti CSS cache
# Skontroluj Tailwind config
# Reštartuj dev server
```

## 🛠️ Diagnostické príkazy

```bash
# Rýchla diagnostika
npm run vite:check

# Vyčisti cache
npm run vite:cache

# Full reset (NUCLEAR OPTION)
npm run vite:reset

# Troubleshooting menu
npm run vite:troubleshoot
```

## 🔧 Preventívne opatrenia

### 1. **Vite konfigurácia** (vite.config.ts)
```typescript
server: {
  strictPort: true,    // Nikdy nemieň port
  hmr: { port: 24678 } // Špecifický HMR port
}
```

### 2. **Import best practices**
```typescript
// ✅ Správne importy
import Component from './Component.tsx'
import { helper } from '../utils/helper.ts'
import '@/styles/global.css'

// ❌ Problematické importy  
import Component from './Component'
import { helper } from '../utils/helper'
```

### 3. **Environment variables**
```bash
# .env.local
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=BlackRent
```

### 4. **Asset handling**
```typescript
// ✅ Správne cesty k assetom
/public/images/logo.png        # Statické súbory
import logo from '@/assets/logo.png' # Importované assety

// ❌ Problematické cesty
./src/assets/logo.png          # Relatívne cesty môžu zlyhať
```

## 🚨 Emergency riešenia

### Ak nič nefunguje:
```bash
# 1. Full reset
npm run vite:reset

# 2. Ak stále nefunguje:
rm -rf node_modules package-lock.json
npm install
npm run daemon:restart

# 3. Ak STÁLE nefunguje:
git stash
git pull origin main
npm install
npm run daemon:restart
```

### Kontakt pri kritických problémoch:
- Spusti: `npm run health`
- Skontroluj: `tail -f logs/daemon.log`
- Pošli logy pre analýzu

## 📊 Monitoring

Vite problémy sa automaticky detekujú v:
- `npm run monitor` - Live monitoring
- `npm run health` - Health check
- Daemon automaticky opravuje bežné problémy

## 🎯 Záver

Vite je mocný nástroj, ale má svoje špecifiká. S týmito nástrojmi a postupmi by si mal zvládnuť všetky bežné problémy. Pri zložitejších problémoch vždy najprv spusti `npm run vite:check` pre diagnostiku.
