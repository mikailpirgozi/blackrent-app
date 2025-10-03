# Blackrent - Systém pre správu prenájmov vozidiel

## Popis

Blackrent je webová aplikácia pre správu prenájmov vozidiel s backend API a frontend React aplikáciou. Systém umožňuje správu vozidiel, prenájmov, zákazníkov, nákladov a poistiek.

## Architektúra

- **Frontend**: React + TypeScript + Material-UI
- **Backend**: Node.js + Express + TypeScript + SQLite
- **Databáza**: SQLite (pre jednoduchosť, možno nahradiť PostgreSQL/MySQL)

## Inštalácia a spustenie

### Backend

1. Prejdite do priečinka backend:
```bash
cd backend
```

2. Nainštalujte závislosti:
```bash
npm install
```

3. Vytvorte .env súbor:
```bash
PORT=5000
NODE_ENV=development
JWT_SECRET=blackrent-super-secret-key-change-in-production
```

4. Spustite vývojový server:
```bash
npm run dev
```

Backend bude dostupný na `http://localhost:5000`

### Frontend

1. V koreňovom priečinku projektu:
```bash
npm install
```

2. Spustite vývojový server:
```bash
npm start
```

Frontend bude dostupný na `http://localhost:3000`

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

## Funkcie

### Frontend
- ✅ Správa vozidiel (pridávanie, úprava, mazanie)
- ✅ Správa prenájmov s automatickými výpočtami
- ✅ Správa zákazníkov
- ✅ Správa nákladov
- ✅ Správa poistiek
- ✅ Vyúčtovania a štatistiky
- ✅ Import/Export CSV s ISO 8601 dátumami
- ✅ Responzívny dizajn pre mobilné zariadenia
- ✅ Filtrovanie a triedenie prenájmov
- ✅ Automatické ukladanie do localStorage (zatiaľ)

### Backend
- ✅ RESTful API
- ✅ SQLite databáza
- ✅ TypeScript podpora
- ✅ CORS podpora
- ✅ Error handling
- ✅ Logging

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

## Prípadné vylepšenia

- [ ] Autentifikácia a autorizácia (JWT)
- [ ] PostgreSQL/MySQL databáza
- [ ] Docker kontajnerizácia
- [ ] Unit testy
- [ ] E-mail notifikácie
- [ ] PDF reporty
- [ ] Real-time notifikácie (WebSocket)
- [ ] Backup a restore databázy
- [ ] API dokumentácia (Swagger)

## Podpora

Pre otázky a problémy vytvorte issue v GitHub repozitári.
# Force Railway redeploy
# Force Vercel redeploy Thu Jul 31 11:22:56 CEST 2025
# Trigger Vercel deployment
# Force cache bust Fri Oct  3 04:10:35 CEST 2025
