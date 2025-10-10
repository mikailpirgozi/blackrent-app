# 🚀 BlackRent Quick Start Guide

## 🔥 Najrýchlejšie spustenie (1 príkaz):

```bash
npm run quick-fix
```

**ALEBO:**

```bash
./fix.sh
```

## 🛠️ Čo robiť keď sa aplikácia "zasekne":

### ❌ **Problémy s cache (najčastejšie):**
```bash
npm run quick-fix
```

### ❌ **Aplikácia sa nespustí:**
```bash
npm run dev:restart
```

### ❌ **Porty sú obsadené:**
```bash
npm run dev:stop
npm run dev:start
```

### ❌ **Všetko je rozbité:**
```bash
./fix.sh
```

## 📱 **Adresy aplikácie:**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **Root-3 stránka**: http://localhost:3000/root-3
- **Login**: admin / Black123

## 🔍 **Diagnostika a prevencia:**

```bash
npm run health     # Rýchla diagnostika
npm run diagnose   # Detailná diagnostika
npm run monitor    # Live monitoring
npm run check      # Kontrola pred kódením
npm run dev:safe   # Bezpečné spustenie
```

## 💡 **Prečo sa to deje s Vite:**

1. **Cache problémy** - Vite si cachuje moduly agresívne
2. **Hot reload** - Niekedy sa "zasekne" a nerefreshuje
3. **TypeScript compilation** - Kompilované súbory zostanú v cache
4. **Browser cache** - Prehliadač drží staré verzie

## ✅ **Riešenie je jednoduché:**

**Vždy keď máš problém, spusti:**
```bash
npm run quick-fix
```

**Tento príkaz:**
- ✅ Zastaví všetky procesy
- ✅ Vyčistí všetky cache súbory  
- ✅ Vyčistí porty
- ✅ Spustí aplikáciu s čistou cache
- ✅ Funguje za 30 sekúnd

## 🎯 **Tip:**

Pridaj si alias do svojho `.zshrc` alebo `.bashrc`:

```bash
alias br="cd /path/to/blackrent && npm run quick-fix"
```

Potom stačí napísať `br` a aplikácia sa spustí!
