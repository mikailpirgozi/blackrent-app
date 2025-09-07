# 🚀 KOMPLETNÝ PRÍRUČKA NASTAVENIA PROJEKTU

## 📋 OBSAH
1. [ESLint & TypeScript Konfigurácia](#eslint--typescript-konfigurácia)
2. [Cursor Rules](#cursor-rules)
3. [Git Hooks & Automatizácia](#git-hooks--automatizácia)
4. [Package.json Scripts](#packagejson-scripts)
5. [Code Quality Rules](#code-quality-rules)
6. [Build & Deployment](#build--deployment)
7. [Development Workflow](#development-workflow)

---

## 🔧 ESLint & TypeScript Konfigurácia

### `.eslintrc.js`
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // ZAKÁZANÉ - TREAT AS ERRORS
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'no-case-declarations': 'error',
    '@typescript-eslint/ban-types': 'error',
    
    // WARNINGS
    'no-console': 'warn',
    'prefer-const': 'warn',
    'no-var': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "build", "dist"]
}
```

---

## 🎯 Cursor Rules

### `.cursorrules`
```
# 🚨 PROJECT RULES - ZERO TOLERANCE FOR ERRORS/WARNINGS 🚨

## 🔥 CRITICAL: ZERO ERRORS, ZERO WARNINGS POLICY

**ABSOLÚTNE PRAVIDLO:** Pri každej úprave kódu MUSÍŠ automaticky opraviť VŠETKY errors a warnings. NIKDY nemôžeš nechať kód s chybami!

### ⚡ AUTOMATICKÉ OPRAVOVANIE - POVINNÉ

Pred každým commitom MUSÍŠ:

1. **Spustiť ESLint fix:** `npx eslint src --ext .ts,.tsx --fix`
2. **Skontrolovať warnings:** `npx eslint src --ext .ts,.tsx --max-warnings=0`
3. **Spustiť TypeScript check:** `npm run build`
4. **Opraviť VŠETKY chyby** - bez výnimky!

### 🎯 PRÍSNE ESLINT PRAVIDLÁ

Tieto pravidlá sú nastavené ako **ERROR** (nie warning):

- `@typescript-eslint/no-explicit-any` - ZAKÁZANÉ `any` typy
- `@typescript-eslint/no-unused-vars` - ZAKÁZANÉ nepoužívané premenné
- `@typescript-eslint/consistent-type-imports` - Konzistentné importy
- `@typescript-eslint/ban-ts-comment` - ZAKÁZANÉ `@ts-ignore`
- `react-hooks/exhaustive-deps` - Správne React dependencies
- `no-case-declarations` - Správne case deklarácie
- `@typescript-eslint/ban-types` - ZAKÁZANÉ nebezpečné typy

### 🛠️ AUTOMATICKÉ OPRAVY

**Nepoužívané importy/premenné:**
```typescript
// ❌ ZLÉ
import { UnusedIcon } from '@mui/icons-material';
const unusedVariable = 'test';

// ✅ SPRÁVNE - zakomentuj alebo odstráň
// import { UnusedIcon } from '@mui/icons-material';
// const unusedVariable = 'test';
```

**Any typy:**
```typescript
// ❌ ZLÉ
const data: any = {};
const users: any[] = [];

// ✅ SPRÁVNE
const data: Record<string, unknown> = {};
const users: Record<string, unknown>[] = [];
```

**React hooks dependencies:**
```typescript
// ❌ ZLÉ
useEffect(() => {
  loadData();
}, []);

// ✅ SPRÁVNE
const loadData = useCallback(() => {
  // logic
}, [dependency1, dependency2]);

useEffect(() => {
  loadData();
}, [loadData]);
```

**TypeScript importy:**
```typescript
// ❌ ZLÉ
import React from 'react';
import { Component } from 'react';

// ✅ SPRÁVNE
import type React from 'react';
import type { Component } from 'react';
```

### 🚀 WORKFLOW PRE KAŽDÚ ÚPRAVU

1. **Urob zmenu v kóde**
2. **Automaticky spusti:** `npx eslint src --ext .ts,.tsx --fix`
3. **Skontroluj:** `npx eslint src --ext .ts,.tsx --max-warnings=0`
4. **Ak sú chyby:** Oprav ich VŠETKY
5. **Test build:** `npm run build`
6. **Commit len ak je 0 errors, 0 warnings**

### 🎯 CURSOR AI INŠTRUKCIE

Keď upravuješ kód:

1. **VŽDY** po úprave spusti ESLint fix
2. **VŽDY** skontroluj že nie sú warnings/errors
3. **VŽDY** oprav všetky problémy pred pokračovaním
4. **NIKDY** nenechaj kód s chybami
5. **VŽDY** používaj správne TypeScript typy
6. **VŽDY** odstráň nepoužívané importy/premenné
7. **VŽDY** oprav React hooks dependencies

### 🔧 RÝCHLE PRÍKAZY

```bash
# Oprav všetky ESLint chyby
npx eslint src --ext .ts,.tsx --fix

# Skontroluj že nie sú warnings
npx eslint src --ext .ts,.tsx --max-warnings=0

# Test build
npm run build

# Commit s automatickým formátovaním
npm run commit
```

### 🚨 ABSOLÚTNY ZÁKAZ

- ❌ Commitovať kód s warnings/errors
- ❌ Používať `any` typy
- ❌ Nechávať nepoužívané importy/premenné
- ❌ Ignorovať React hooks dependencies
- ❌ Používať `@ts-ignore` namiesto `@ts-expect-error`
- ❌ Nechávať nedokončené opravy

### ✅ POVINNÉ AKCIE

- ✅ Vždy 0 errors, 0 warnings
- ✅ Automatické opravovanie po každej úprave
- ✅ Správne TypeScript typy
- ✅ Čisté importy a premenné
- ✅ Správne React patterns
- ✅ Build test pred commitom

**PAMÄTAJ: Kvalita kódu je priorita #1. Radšej menej funkcionalít ale perfektný kód!**
```

---

## 🔗 Git Hooks & Automatizácia

### `package.json` - Husky & lint-staged
```json
{
  "devDependencies": {
    "husky": "^8.0.3",
    "lint-staged": "^13.2.3",
    "prettier": "^3.0.0"
  },
  "scripts": {
    "prepare": "husky install",
    "commit": "git add . && git commit",
    "push-safe": "npm run lint:fix && npm run build && git add . && git commit && git push"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 📦 Package.json Scripts

### Kompletné `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    
    "lint": "eslint src --ext .ts,.tsx --max-warnings=0",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "lint:check": "eslint src --ext .ts,.tsx --max-warnings=0",
    
    "format": "prettier -w .",
    "format:check": "prettier -c .",
    
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    
    "commit": "git add . && git commit",
    "push-safe": "npm run lint:fix && npm run build && git add . && git commit && git push",
    
    "clean": "rm -rf dist node_modules/.vite",
    "fresh": "npm run clean && npm install",
    
    "health": "npm run lint:check && npm run type-check && npm run build",
    "fix": "npm run lint:fix && npm run format",
    
    "pre-commit": "npm run lint:check && npm run type-check"
  }
}
```

---

## 🎯 Code Quality Rules

### TypeScript Best Practices
```typescript
// ✅ SPRÁVNE - Explicitné typy
interface User {
  id: string;
  name: string;
  email: string;
}

const users: User[] = [];
const userData: Record<string, unknown> = {};

// ✅ SPRÁVNE - Type imports
import type { ComponentProps } from 'react';
import type { User } from './types';

// ✅ SPRÁVNE - React hooks
const [users, setUsers] = useState<User[]>([]);

const loadUsers = useCallback(async () => {
  const response = await fetch('/api/users');
  const data = await response.json();
  setUsers(data);
}, []);

useEffect(() => {
  loadUsers();
}, [loadUsers]);

// ✅ SPRÁVNE - Error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  throw new Error('Failed to perform operation');
}
```

### React Best Practices
```typescript
// ✅ SPRÁVNE - Functional components
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ onClick, children, variant = 'primary' }) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ✅ SPRÁVNE - Custom hooks
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { users, loading, error, loadUsers };
};
```

---

## 🚀 Build & Deployment

### Build Checklist
```bash
# 1. Opraviť všetky chyby
npm run lint:fix

# 2. Skontrolovať typy
npm run type-check

# 3. Spustiť testy
npm run test:run

# 4. Build aplikácie
npm run build

# 5. Skontrolovať že build prešiel
ls -la dist/

# 6. Commit a push
npm run push-safe
```

### Environment Variables
```bash
# .env.local
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=MyApp
VITE_DEBUG=false
```

---

## 🔄 Development Workflow

### Denný workflow
```bash
# Ráno - štart projektu
npm run dev

# Počas práce - kontinuálne kontroly
npm run health  # každých 30 minút

# Pred commitom - povinné kontroly
npm run lint:check
npm run type-check
npm run build

# Commit
npm run commit

# Push
git push
```

### Troubleshooting
```bash
# Ak sú problémy s buildom
npm run clean
npm install
npm run build

# Ak sú problémy s ESLint
npm run lint:fix
npm run format

# Ak sú problémy s typmi
npm run type-check:watch
```

---

## 📋 Quick Setup Commands

### Pre nový projekt
```bash
# 1. Inštalácia dependencies
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D eslint-plugin-react eslint-plugin-react-hooks
npm install -D prettier husky lint-staged
npm install -D vitest @vitejs/plugin-react

# 2. Nastavenie Husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# 3. Vytvorenie konfiguračných súborov
# (skopíruj obsah z vyššie)

# 4. Test setup
npm run health
```

---

## 🎯 Kľúčové Princípy

1. **ZERO TOLERANCE** - Žiadne errors ani warnings
2. **AUTOMATIZÁCIA** - Všetko sa opravuje automaticky
3. **KVALITA PRED RÝCHLOSŤOU** - Radšej menej funkcionalít ale perfektný kód
4. **KONTINUÁLNA KONTROLA** - Každá zmena sa kontroluje
5. **KONZISTENTNOSŤ** - Rovnaké pravidlá všade
6. **DOKUMENTÁCIA** - Všetko je zdokumentované

---

**💡 TIP:** Tento dokument si ulož ako `PROJECT_SETUP_GUIDE.md` do root adresára každého nového projektu a postupuj podľa neho krok za krokom!
