# 🚗 BlackRent - Systém pre správu prenájmov vozidiel

> **Profesionálny autopožičovňa management systém**

BlackRent je komplexná webová aplikácia pre správu prenájmov vozidiel s pokročilým backend API a moderným React frontend. Systém umožňuje správu vozidiel, prenájmov, zákazníkov, nákladov, poistiek, protokolov a multi-tenancy platform management.

## 📚 Dokumentácia

**Kompletná dokumentácia je dostupná tu: [DOCUMENTATION.md](./DOCUMENTATION.md)**

### Quick Links
- 🚀 [Getting Started](./docs/01-getting-started/README.md)
- 📖 [Kompletný Dokumentačný Index](./docs/README.md)
- 🏗️ [Architecture Overview](./docs/architecture/ARCHITECTURE.md)
- 🚀 [Deployment Guide](./docs/deployment/DEPLOYMENT-GUIDE.md)
- 🔧 [Diagnostics Guide](./docs/diagnostics/DIAGNOSTICS-GUIDE.md)

## 🏗️ Architektúra

- **Frontend**: React + TypeScript + shadcn/ui (migrované z Material-UI)
- **Backend**: Node.js + Express + TypeScript
- **Databáza**: PostgreSQL (Railway)
- **Storage**: Cloudflare R2
- **Email**: SMTP/IMAP (Active24)
- **Deployment**: Railway (backend) + Vercel (frontend)

## 🚀 Quick Start

### Kompletná Inštalácia

```bash
# 1. Nainštaluj dependencies (pnpm only)
pnpm install

# 2. Setup environment (.env súbory)
# Skopíruj .env.example a vyplň hodnoty

# 3. Spusti aplikáciu
npm run dev:start
```

**Frontend:** http://localhost:3000  
**Backend:** http://localhost:3001

### Užitočné Príkazy

```bash
# Development
npm run dev:start      # Spustiť celú aplikáciu
npm run dev:stop       # Zastaviť aplikáciu
npm run dev:restart    # Reštartovať aplikáciu

# Diagnostics
npm run health         # Health check
npm run fix            # Auto-fix problémov
npm run diagnose       # Interaktívna diagnostika

# Testing
npm run test           # Spustiť testy
npm run test:ui        # Test UI

# Build
npm run build          # Build frontend
cd backend && npm run build  # Build backend
```

**Viac info:** [Getting Started Guide](./docs/01-getting-started/QUICK-START.md)

## API Endpoints

### Vozidlá
- `GET /api/vehicles` - Získať všetky vozidlá
- `GET /api/vehicles/:id` - Získať konkrétne vozidlo
- `POST /api/vehicles` - Vytvoriť nové vozidlo
- `PUT /api/vehicles/:id` - Aktualizovať vozidlo
- `DELETE /api/vehicles/:id` - Vymazať vozidlo

### Prenájmy
- `GET /api/rentals` - Získať všetky prenájmy
- `GET /api/rentals/:id` - Získať konkrétny prenájom
- `POST /api/rentals` - Vytvoriť nový prenájom
- `PUT /api/rentals/:id` - Aktualizovať prenájom
- `DELETE /api/rentals/:id` - Vymazať prenájom

### Health Check
- `GET /health` - Kontrola funkčnosti API

## ✨ Hlavné Features

### 🚗 Vozidlá & Prenájmy
- ✅ Kompletná správa vozidiel
- ✅ Správa prenájmov s automatickými výpočtami
- ✅ Availability tracking
- ✅ Clone rental funkcionalita
- ✅ Smart priority sorting

### 👥 Zákazníci & Platformy
- ✅ Správa zákazníkov
- ✅ Multi-tenancy platform management
- ✅ Company isolation
- ✅ Platform statistics

### 📄 Protokoly V2
- ✅ Digital handover/return protocols
- ✅ 5 kategórií fotiek (vehicle, document, damage, odometer, fuel)
- ✅ Digitálne podpisy (employee + customer)
- ✅ Automatické PDF generovanie
- ✅ Cloudflare R2 storage
- ✅ Real-time progress tracking

### 💰 Financie & Štatistiky
- ✅ Správa nákladov a poistiek
- ✅ Leasing systém
- ✅ Vyúčtovania (settlements)
- ✅ Detailné štatistiky
- ✅ Financial reports

### 📧 Email Systém
- ✅ SMTP/IMAP integrácia
- ✅ Automatické notifikácie
- ✅ Protocol doručovanie
- ✅ Email monitoring

### 🔐 Security & Permissions
- ✅ JWT Authentication
- ✅ Role-based permissions
- ✅ Company isolation (RLS)
- ✅ Audit logging

### 🎨 UI/UX
- ✅ Modern shadcn/ui components
- ✅ Dark/Light mode
- ✅ Responzívny dizajn
- ✅ Enhanced filters & search
- ✅ Real-time updates (WebSocket)

**Viac info:** [Features Documentation](./docs/features/)

## Databáza

SQLite databáza sa automaticky vytvorí v súbore `backend/blackrent.db` pri prvom spustení.

### Tabuľky
- `users` - Používatelia systému
- `vehicles` - Vozidlá
- `customers` - Zákazníci
- `rentals` - Prenájmy
- `expenses` - Náklady
- `insurances` - Poistky

## CSV Import/Export

Aplikácia podporuje import a export prenájmov v CSV formáte s ISO 8601 dátumami:

```csv
id,licensePlate,customerName,startDate,endDate,totalPrice,commission,paymentMethod
1,AB123CD,Jan Novák,2025-01-03T23:00:00.000Z,2025-01-05T23:00:00.000Z,200.00,40.00,cash
```

## Vývoj

### Backend skripty
- `npm run dev` - Vývojový server s automatickým reštartovaním
- `npm run build` - Kompilácia TypeScript
- `npm start` - Spustenie produkčného servera

### Frontend skripty
- `npm start` - Vývojový server
- `npm run build` - Build pre produkciu
- `npm test` - Spustenie testov

## Nasadenie

### Backend
1. Kompilujte TypeScript:
```bash
cd backend
npm run build
```

2. Spustite produkčný server:
```bash
npm start
```

### Frontend
1. Vytvorte produkčný build:
```bash
npm run build
```

2. Nasajte obsah `build` priečinka na webový server

## 🔮 Budúce Vylepšenia

### V Pláne
- [ ] Customer website (blackrent.sk)
- [ ] Owner portal (multi-tenant booking platform)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] AI-powered chat support
- [ ] Automatic damage detection (AI)
- [ ] Integration s účtovníctvom

### V Úvahe
- [ ] Multi-language support
- [ ] White-label solutions
- [ ] Fleet optimization algorithms
- [ ] Predictive maintenance
- [ ] Blockchain-based verification

**Viac info:** [Implementation Plans](./docs/04-implementation-plans/)

---

## 📊 Project Statistics

- **Lines of Code:** 50,000+
- **Features Implemented:** 100+
- **Documentation Pages:** 150+
- **Test Coverage:** Improving
- **Active Development:** ✅

---

## 🤝 Contributing

Pre príspevky k projektu:
1. Prečítaj [Development Workflow](./docs/setup/DEVELOPMENT-WORKFLOW.md)
2. Skontroluj [Architecture Guide](./docs/architecture/ARCHITECTURE.md)
3. Dodržuj [TypeScript Best Practices](./docs/architecture/TYPESCRIPT_BEST_PRACTICES.md)

---

## 📞 Podpora

### Pri Problémoch
1. [Diagnostics Guide](./docs/diagnostics/DIAGNOSTICS-GUIDE.md)
2. Spusti `npm run diagnose`
3. Pozri [Fixes & Bugs](./docs/08-fixes-and-bugs/)

### Pre Otázky
- Vytvor issue v GitHub repository
- Alebo kontaktuj project maintainera

---

## 📄 Licencia

Proprietary - BlackRent © 2025

---

**Made with ❤️ for efficient car rental management**
