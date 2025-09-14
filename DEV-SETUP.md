# 🚀 BlackRent Development Setup

## 📁 Monorepo Štruktúra

```
BlackRent Beta 2/                 ← ROOT MONOREPO (otvor toto v Cursor!)
├── apps/
│   ├── web/                     ← Web aplikácia (React + Vite)
│   ├── backend/                 ← Backend API (Node.js + Express)
│   ├── customer-website/        ← Customer website (Next.js)
│   └── mobile/                  ← Mobile app (React Native + Expo)
├── dev-web.sh                   ← Spusti len web
├── dev-backend.sh               ← Spusti len backend
├── dev-customer.sh              ← Spusti len customer website
├── dev-mobile.sh                ← Spusti len mobile
└── package.json                 ← Monorepo konfigurácia
```

## 🎯 Ako Spustiť Development

### **Option 1: Jednotlivé Aplikácie (ODPORÚČANÉ)**

```bash
# Web aplikácia (port 3000)
./dev-web.sh

# Backend API (port 3001)  
./dev-backend.sh

# Customer website (port 3002)
./dev-customer.sh

# Mobile app
./dev-mobile.sh
```

### **Option 2: Všetko Naraz**

```bash
# Web + Backend
npm run dev

# Všetky aplikácie
npm run dev:all
```

## 📋 Porty

- **Web App:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Customer Website:** http://localhost:3002
- **Mobile:** Expo DevTools

## 🔧 Setup Pre Každú Aplikáciu

### **Web App**
```bash
cd apps/web
npm install
npm run dev
```

### **Backend**
```bash
cd apps/backend
npm install
npm run dev
```

### **Customer Website**
```bash
cd apps/customer-website
npm install
npm run dev
```

### **Mobile**
```bash
cd apps/mobile
npm install
expo start
```

## 💡 Tipy

1. **V Cursor otvor ROOT priečinok** (`BlackRent Beta 2/`), nie `apps/web`
2. **Pre každú aplikáciu** môžeš otvoriť samostatný Cursor window
3. **Backend musí bežať** aby web app fungoval správne
4. **Všetky aplikácie** majú vlastné package.json a dependencies

## 🚨 Riešenie Problémov

- **Port obsadený:** `lsof -ti:3000,3001,3002 | xargs kill -9`
- **Dependencies chýbajú:** `cd apps/[app] && npm install`
- **Cache problémy:** `rm -rf node_modules && npm install`
