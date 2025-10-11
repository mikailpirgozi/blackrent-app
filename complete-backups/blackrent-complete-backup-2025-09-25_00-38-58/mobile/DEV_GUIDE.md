# 🔥 BlackRent Mobile - Developer Guide

## 🎯 Ako správne vyvíjať mobilnú aplikáciu

### ✅ **Správny spôsob spustenia pre development**

```bash
cd apps/mobile
./start-dev.sh   # Optimalizované pre hot reload
```

Tento script:
- ✅ Zapne Fast Refresh (okamžité zmeny)
- ✅ Vypne web bundling (žiadne Stripe chyby)
- ✅ Optimalizuje cache pre rýchle rebuildy
- ✅ Zachová state pri hot reload

### 🚀 **Hot Reload Best Practices**

#### Kedy funguje Hot Reload automaticky:
- ✅ Zmeny v JSX/TSX komponentoch
- ✅ Zmeny v štýloch (StyleSheet)
- ✅ Zmeny v render metódach
- ✅ Pridanie/odstránenie props

#### Kedy musíte manuálne reloadnúť (Cmd+R):
- ❌ Zmeny v `app.json` alebo `app.config.js`
- ❌ Pridanie nových dependencies
- ❌ Zmeny v native moduloch
- ❌ Zmeny v metro.config.js

### 🛡️ **Ako predísť chybám pri vývoji**

#### 1. **Používajte Error Boundary**
Aplikácia má teraz DevErrorBoundary ktorý:
- Zachytí chyby bez pádu aplikácie
- Zobrazí error screen s detailmi
- Umožní reset bez reštartu

#### 2. **TypeScript nastavenia pre development**
```json
// tsconfig.json pre development
{
  "compilerOptions": {
    "strict": false,  // Menej striktné počas vývoja
    "skipLibCheck": true,  // Rýchlejšie builds
    "noEmitOnError": false  // Build aj s chybami
  }
}
```

#### 3. **ESLint pre development**
```bash
# Ignorujte warnings počas vývoja
ESLINT_NO_DEV_ERRORS=true pnpm expo start

# Alebo vypnite ESLint úplne
pnpm expo start --no-dev
```

### 🔧 **Riešenie častých development problémov**

#### Problem: "Module not found" po pridaní dependency
```bash
# Riešenie:
cd apps/mobile
rm -rf node_modules
pnpm install
./start-dev.sh --clean
```

#### Problem: Hot reload nefunguje
```bash
# Riešenie:
# 1. Skontrolujte či je Fast Refresh zapnutý
# V simulátore: Cmd+D → Fast Refresh → Enable

# 2. Reštartujte Metro
pkill -f metro
./start-dev.sh
```

#### Problem: Chyby pri importovaní obrázkov/assetov
```typescript
// ❌ Zlé
import image from './image.png';

// ✅ Správne
const image = require('./image.png');
// alebo
import { Image } from 'react-native';
<Image source={require('./image.png')} />
```

#### Problem: State sa stráca pri hot reload
```typescript
// Použite React.memo pre zachovanie state
export default React.memo(MyComponent);

// Alebo použite hooks správne
const [state, setState] = useState(() => {
  // Lazy initial state
  return initialValue;
});
```

### 📝 **Development Workflow**

#### 1. **Začiatok práce**
```bash
cd apps/mobile
./start-dev.sh
# Počkajte na "Metro waiting on..."
# Otvorte simulátor (stlačte 'i')
```

#### 2. **Počas vývoja**
- ✅ Robte malé zmeny postupne
- ✅ Testujte po každej zmene
- ✅ Používajte console.log pre debugging
- ✅ Sledujte Metro konzolu pre chyby

#### 3. **Pri problémoch**
```bash
# Quick fix - väčšinou pomôže
Cmd+R v simulátore

# Hard reload - ak Quick fix nepomohol
./start-dev.sh --clean

# Nuclear option - ak nič nefunguje
cd apps/mobile
rm -rf node_modules .expo .metro-cache
pnpm install
./start-dev.sh
```

### 🎨 **Štýlovanie bez chýb**

#### Používajte Tailwind správne
```typescript
// ❌ Zlé - spôsobí chybu
<View className={`bg-${color}-500`}>

// ✅ Správne - statické triedy
<View className="bg-blue-500">
```

#### StyleSheet pre dynamické štýly
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: dynamicColor, // OK pre dynamické hodnoty
  }
});
```

### 🔍 **Debugging Tips**

#### 1. **React DevTools**
```bash
# Nainštalujte ak nemáte
npm install -g react-devtools

# Spustite v novom termináli
react-devtools
```

#### 2. **Flipper (odporúčané)**
- Stiahnite z: https://fbflipper.com/
- Automaticky sa pripojí k vašej aplikácii
- Vidíte: Network, Logs, Layout, Database

#### 3. **Chrome DevTools**
- V simulátore: Cmd+D → Debug JS Remotely
- Otvorí sa Chrome s plným debuggerom

### 💡 **Pro Tips**

1. **Alias imports pre čistejší kód**
```typescript
// Namiesto
import Component from '../../../components/Component';

// Použite
import Component from '@/components/Component';
```

2. **Snippet pre rýchly component**
```typescript
// rnfc snippet
import React from 'react';
import { View, Text } from 'react-native';

export const ComponentName = () => {
  return (
    <View>
      <Text>ComponentName</Text>
    </View>
  );
};
```

3. **Auto-import fix**
```bash
# Ak VS Code nevidí imports
Cmd+Shift+P → TypeScript: Restart TS Server
```

### 🚫 **Čomu sa vyhnúť**

- ❌ Nepoužívajte `npm`, len `pnpm`
- ❌ Nemeňte `node_modules` priamo
- ❌ Necommitujte `.expo` priečinok
- ❌ Nepoužívajte `console.error` v komponentoch (spôsobí red screen)
- ❌ Nezabudnite odstrániť `console.log` pred commitom

### 📱 **Platform-specific kód**

```typescript
import { Platform } from 'react-native';

// Pre platform-specific hodnoty
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    ...Platform.select({
      ios: { backgroundColor: 'white' },
      android: { backgroundColor: 'grey' },
    }),
  },
});

// Pre platform-specific komponenty
{Platform.OS === 'ios' ? <IosComponent /> : <AndroidComponent />}
```

### 🔄 **Príkazy pre rýchlu prácu**

```bash
# Development s hot reload
./start-dev.sh

# Production-like build
pnpm expo start --no-dev --minify

# Clear všetko a začni znova
./start-mobile.sh

# Len iOS
pnpm expo start --ios

# Len Android  
pnpm expo start --android

# Web preview (ak funguje)
pnpm expo start --web
```

---

**Zapamätajte:** Development má byť rýchly a príjemný. Ak strávite viac ako 5 minút riešením problému, použite `./start-dev.sh --clean` a pokračujte v práci! 🚀
