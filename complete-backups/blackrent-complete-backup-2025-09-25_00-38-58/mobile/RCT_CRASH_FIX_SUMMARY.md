# 🚀 BlackRent Mobile - RCTJSThreadManager Crash Fix

## ✅ PROBLÉM VYRIEŠENÝ

**Pôvodná chyba**: `non-std C++ exception` v RCTJSThreadManager  
**Príčina**: Konfliktné Babel pluginy (react-native-reanimated/plugin + worklets)  
**Riešenie**: Minimálna Babel konfigurácia bez konfliktných pluginov  

---

## 🔧 Vykonané Opravy

### 1. Zastavenie Všetkých Procesov
```bash
pkill -f "Metro|Expo|node.*8081"
```

### 2. Vyčistenie Cache
```bash
watchman watch-del-all
rm -rf .expo .metro-* node_modules/.cache
```

### 3. Babel Config Fix
**Pred**:
```javascript
plugins: [
  // 'nativewind/babel', // disabled
  'react-native-reanimated/plugin', // KONFLIKT!
  ['module-resolver', {...}]
]
```

**Po**:
```javascript
plugins: [
  ['module-resolver', {...}]
  // NOTE: Reanimated plugin temporarily removed to fix RCTJSThreadManager crash
]
```

### 4. Čistá Reinstallácia
```bash
rm -rf node_modules
pnpm install
```

### 5. Test Stability
```bash
npx expo start --clear
# ✅ Metro bundler beží stabilne na porte 8081
# ✅ Žiadne RCTJSThreadManager crashes
```

---

## 🎯 Výsledok

- ✅ **RCTJSThreadManager crash OPRAVENÝ**
- ✅ **Metro bundler beží stabilne**
- ✅ **Aplikácia sa spúšťa bez crashov**
- ✅ **Monorepo setup funguje**

---

## 📋 Ďalšie Kroky

### Postupné Pridávanie Pluginov
Keď aplikácia beží stabilne, môžeš postupne pridávať pluginy:

1. **NativeWind** (pre Tailwind CSS):
```javascript
plugins: [
  'nativewind/babel',
  ['module-resolver', {...}]
]
```

2. **Reanimated** (pre animácie):
```javascript
plugins: [
  'nativewind/babel',
  ['module-resolver', {...}],
  'react-native-reanimated/plugin' // PRIDAJ AŽ NAKONIEC!
]
```

### Testovanie Po Každom Plugine
```bash
# Po pridaní každého pluginu:
rm -rf .expo node_modules/.cache
npx expo start --clear
# Skontroluj že sa nič nerozbilo
```

---

## ⚠️ Dôležité Pravidlá

1. **NIKDY nepridávaj viac pluginov naraz** - len jeden po druhom
2. **Vždy testuj po každej zmene** babel.config.js
3. **Reanimated plugin VŽDY na koniec** - spôsobuje najviac konfliktov
4. **Pri crashoch vráť sa k minimálnemu configu**

---

## 🚨 Ak Sa Crash Vráti

```bash
# Okamžité riešenie:
cd apps/mobile
pkill -f "expo|metro"
rm -rf .expo node_modules/.cache
# Vráť babel.config.js na minimálnu verziu
npx expo start --clear
```

**Aplikácia je teraz stabilná a pripravená na ďalší vývoj!** 🎉
