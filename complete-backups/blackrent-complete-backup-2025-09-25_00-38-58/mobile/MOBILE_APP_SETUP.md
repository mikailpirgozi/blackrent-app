# 📱 BlackRent Mobile App - Setup & Troubleshooting Guide

## 🚀 Rýchle spustenie

```bash
# Jednoduché spustenie aplikácie
cd apps/mobile
./start-mobile.sh
```

## ⚙️ Správna konfigurácia projektu

### ✅ Súbory ktoré MUSÍTE mať:
- `index.js` - hlavný vstupný bod (NIE index.ts)
- `metro.config.js` - Metro bundler konfigurácia
- `babel.config.js` - Babel konfigurácia
- `app/_layout.tsx` - Expo Router layout

### ❌ Súbory ktoré NESMÚ existovať:
- `index.ts` - duplicitný vstupný bod
- `App.tsx` - starý vstupný bod (Expo Router používa app/_layout.tsx)
- `metro.config.cjs` - duplicitná konfigurácia
- `babel.config.cjs` - duplicitná konfigurácia
- `package-lock.json` - používame pnpm, nie npm

### 📦 Package.json nastavenia:
```json
{
  "name": "@blackrent/mobile",
  "version": "1.0.0",
  "main": "index.js",
  // ❌ NEPOUŽÍVAŤ "type": "module" - spôsobuje CommonJS problémy
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~5.1.6",
    // ... ostatné dependencies
  }
}
```

## 🔧 Časté problémy a riešenia

### Problem 1: "Unable to resolve module expo-router/entry"
**Riešenie:**
```bash
cd apps/mobile
pnpm remove expo-router
pnpm add expo-router@~5.1.6
```

### Problem 2: "require is not defined in ES module scope"
**Riešenie:** Odstráňte `"type": "module"` z package.json

### Problem 3: Port 8081 je obsadený
**Riešenie:**
```bash
# Nájdite proces na porte 8081
lsof -i :8081
# Ukončite ho
kill -9 <PID>
```

### Problem 4: Metro cache problémy
**Riešenie:**
```bash
cd apps/mobile
rm -rf .expo
rm -rf node_modules/.cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

## 📝 Checklist pred spustením

- [ ] Som v správnom adresári: `apps/mobile`
- [ ] Existuje len `index.js`, nie `index.ts` ani `App.tsx`
- [ ] Package.json NEMÁ `"type": "module"`
- [ ] Používam pnpm, nie npm
- [ ] Neexistuje `package-lock.json`
- [ ] Port 8081 je voľný

## 🛠️ Kompletný reset (ak nič nefunguje)

```bash
cd apps/mobile

# 1. Ukončite všetky procesy
pkill -f expo
pkill -f metro

# 2. Vyčistite všetko
rm -rf node_modules
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
rm -f package-lock.json

# 3. Reinstalujte
pnpm install

# 4. Spustite
pnpm expo start --port 8081 --clear
```

## 📱 Spustenie v simulátore

### iOS Simulator:
1. Spustite Expo: `pnpm expo start`
2. Stlačte `i` v termináli
3. Alebo otvorte Expo Go v simulátore

### Android Emulator:
1. Spustite Expo: `pnpm expo start`
2. Stlačte `a` v termináli
3. Alebo otvorte Expo Go v emulátore

## 🌐 Prístupové adresy

- **Web**: http://localhost:8081
- **Metro Bundler**: http://localhost:8081
- **Expo DevTools**: exp://localhost:8081
- **LAN**: exp://192.168.1.12:8081

## 💡 Best Practices

1. **Vždy používajte pnpm** (nie npm ani yarn)
2. **Pred commitom** spustite `pnpm expo doctor`
3. **Pri problémoch** použite `./start-mobile.sh`
4. **Nemodifikujte** metro.config.js ani babel.config.js bez potreby
5. **Udržujte** len jeden vstupný súbor (index.js)

## 🚨 Dôležité upozornenia

- **NIKDY** nepridávajte `"type": "module"` do package.json
- **NIKDY** nevytvárajte duplicitné vstupné súbory
- **VŽDY** používajte pnpm v monorepo
- **VŽDY** vyčistite cache pri problémoch

## 📞 Ak nič nepomáha

1. Skúste kompletný reset (viď vyššie)
2. Reštartujte počítač (vyčistí všetky procesy)
3. Skontrolujte či máte najnovšie verzie:
   - Node.js: 18+
   - pnpm: 8+
   - Expo CLI: najnovšia

---

*Naposledy aktualizované: September 2025*
*Expo SDK: 53.0.0*
*React Native: 0.79.5*
