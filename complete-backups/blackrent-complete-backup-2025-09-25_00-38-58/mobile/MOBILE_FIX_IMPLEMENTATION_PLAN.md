# 🚀 BlackRent Mobile - Kompletný Implementačný Plán Opráv

## 📋 Prehľad
**Cieľ**: Stabilizovať mobile app, opraviť všetky build/runtime problémy  
**Časový odhad**: 2-3 hodiny  
**Riziko**: Stredné (zálohuj si aktuálny stav)  

---

## ⚡ FÁZA 0: Príprava (10 min)

### 1. Záloha aktuálneho stavu
```bash
# V root adresári projektu
git add .
git commit -m "backup: pred mobile fix implementation"
git branch backup-before-mobile-fix
```

### 2. Kontrola aktuálneho stavu
```bash
cd apps/mobile
# Skontroluj či niečo beží
lsof -i :8081
lsof -i :19000
# Zastav všetky procesy
npx kill-port 8081 19000
```

### 3. Vyčisti cache
```bash
# Vyčisti všetko
rm -rf node_modules
rm -rf .expo
rm -rf ios/Pods
rm -rf android/.gradle
watchman watch-del-all 2>/dev/null || true
```

---

## 🔥 FÁZA 1: Kritické Opravy (30 min)

### 1.1 Oprav main entry point ⭐ KRITICKÉ
**Problém**: `"main": "index.js"` spôsobuje "app not registered"  
**Riešenie**:
```json
// apps/mobile/package.json
- "main": "index.js"
+ "main": "expo-router/entry"
```

**Kontrola**:
- [ ] Odstráň `index.js` ak existuje
- [ ] Skontroluj že NEMÁŠ vlastný `AppRegistry.registerComponent`
- [ ] Skontroluj že app folder existuje: `apps/mobile/app/`

### 1.2 Metro Config pre Monorepo ⭐ KRITICKÉ
**Problém**: Metro nevidí shared packages  
**Riešenie**: Vytvor/uprav `apps/mobile/metro.config.js`
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Monorepo support
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Support for .cjs extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
```

**Kontrola**:
- [ ] Metro config existuje v `apps/mobile/metro.config.js`
- [ ] Cesty sú správne (2x .. vedie do root monorepa)

### 1.3 Babel Config cleanup
**Problém**: Konfliktné babel pluginy  
**Riešenie**: Minimálny babel config
```javascript
// apps/mobile/babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      ['module-resolver', {
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@api': './src/api',
          '@blackrent/shared': '../../packages/shared/src'
        }
      }]
    ]
  };
};
```

---

## 🛠️ FÁZA 2: Package.json Cleanup (20 min)

### 2.1 Scripts Update
```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "web": "expo start --web",
    "prebuild": "expo prebuild",
    "build:ios": "eas build --platform ios",
    "build:android": "eas build --platform android",
    "build:all": "eas build --platform all",
    "submit:ios": "eas submit --platform ios",
    "submit:android": "eas submit --platform android",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "reset": "rm -rf node_modules .expo ios/Pods android/.gradle && pnpm install && cd ios && pod install"
  }
}
```

### 2.2 Dependencies Cleanup
**Odstráň duplicity a deprecated**:
```json
// ODSTRÁŇ tieto:
- "@react-navigation/core"
- "@react-navigation/native" 
- "@babel/preset-react"
- "@babel/plugin-syntax-jsx"
- "fbjs"
- "index.js" (ak je v dependencies)

// Ak nepoužívaš web, odstráň aj:
- "react-dom"
- "react-native-web"
```

### 2.3 Google Sign-In Migration
**Nahraď natívny Google Sign-In za Expo Auth Session**:
```bash
# Odstráň starý
pnpm remove @react-native-google-signin/google-signin

# Pridaj nový
pnpm add expo-auth-session expo-crypto
```

---

## 📦 FÁZA 3: Dependencies Alignment (15 min)

### 3.1 Expo Fix
```bash
cd apps/mobile
# Automaticky opraví verzie pre SDK 53
npx expo install --fix
```

### 3.2 Reinstall All
```bash
# Použij JEDEN package manager
pnpm install  # alebo npm install, ale NIE oba!
```

### 3.3 iOS Pods (ak vyvíjaš na Mac)
```bash
cd ios
pod repo update
pod install
cd ..
```

---

## ✅ FÁZA 4: Testovanie (30 min)

### 4.1 Základný Test
```bash
# Spusti development server
pnpm start --clear

# Očakávaný výstup:
# - Metro bundler beží
# - QR kód sa zobrazí
# - Žiadne červené chyby
```

### 4.2 Test na Simulátore/Emulátore
```bash
# iOS (Mac only)
pnpm ios

# Android
pnpm android

# Kontrola:
# - [ ] App sa spustí bez crashu
# - [ ] Navigácia funguje
# - [ ] API volania fungujú
```

### 4.3 Build Test
```bash
# Lokálny prebuild test
pnpm prebuild --clean

# Kontrola:
# - [ ] ios/ a android/ foldery sa vygenerovali
# - [ ] Žiadne chyby v konzole
```

---

## 🔧 FÁZA 5: EAS Setup (20 min)

### 5.1 Inštalácia EAS CLI
```bash
npm install -g eas-cli
eas login  # Prihlás sa do Expo účtu
```

### 5.2 Vytvor eas.json
```json
// apps/mobile/eas.json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "ios": {
        "cocoapods": "1.15.2"
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "your-app-id",
        "appleTeamId": "your-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services-key.json",
        "track": "production"
      }
    }
  }
}
```

### 5.3 Test EAS Build
```bash
# Development build pre testing
eas build --profile development --platform ios
```

---

## 🚨 FÁZA 6: Troubleshooting

### Častý Problém #1: "Unable to resolve module"
```bash
# Riešenie:
npx expo start --clear
rm -rf node_modules && pnpm install
```

### Častý Problém #2: "Metro bundler crashed"
```bash
# Riešenie:
watchman watch-del-all
rm -rf .metro-*
npx kill-port 8081
```

### Častý Problém #3: "Invariant Violation"
```bash
# Riešenie - resetni všetko:
cd apps/mobile
rm -rf node_modules .expo ios android
pnpm install
npx expo prebuild --clean
```

### Častý Problém #4: Babel/Plugin chyby
```bash
# Vráť sa k minimálnemu babel configu:
# Len babel-preset-expo + nativewind/babel
```

---

## ✅ Finálna Kontrola

### Must Pass Checklist:
- [ ] `pnpm start` beží bez chýb
- [ ] App sa spustí v Expo Go
- [ ] Metro bundler vidí shared packages
- [ ] Navigácia (expo-router) funguje
- [ ] API volania prechádzajú
- [ ] Build commands používajú EAS, nie expo build
- [ ] Jeden package manager všade (pnpm)
- [ ] package.json má `"main": "expo-router/entry"`

### Nice to Have:
- [ ] TypeScript build: `pnpm type-check` 
- [ ] Linter: `pnpm lint`
- [ ] Testy: `pnpm test`

---

## 📝 Commit Po Úspechu
```bash
git add .
git commit -m "fix: mobile app complete overhaul - SDK 53 alignment, metro config, EAS migration"
git push
```

---

## 🎯 Výsledok
Po implementácii budeš mať:
- ✅ Stabilnú mobile app bez random crashov
- ✅ Funkčný monorepo setup
- ✅ Moderný stack (SDK 53, React 19, RN 0.79)
- ✅ EAS build pipeline
- ✅ Čistý package.json bez duplicít

## ⏱️ Časový Odhad
- **Rýchly fix** (len kritické): 45 min
- **Kompletná implementácia**: 2-3 hodiny
- **S testovaním a ladením**: 3-4 hodiny

---

## 🆘 Ak Niečo Nejde
1. Vráť sa na backup branch: `git checkout backup-before-mobile-fix`
2. Skús len kritické opravy (FÁZA 1)
3. Pošli mi error logy, pomôžem

**Začni s FÁZA 0 a postupuj systematicky!**
