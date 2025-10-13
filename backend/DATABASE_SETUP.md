# 🗄️ BlackRent Database Setup - Development vs Production

## ✅ Setup dokončený!

Máš teraz **dve oddelené Railway databázy**:

---

## 📊 Databázy

### 🟢 DEVELOPMENT (Bezpečné)
```
Host: switchyard.proxy.rlwy.net
Port: 41478
Database: railway
Tables: 51
Vehicles: 121
```

**Použitie:** Vývoj, testovanie, experimenty

### 🔴 PRODUCTION (Živá aplikácia)
```
Host: trolley.proxy.rlwy.net
Port: 13400
Database: railway
Tables: 51
```

**Použitie:** Len pre živú aplikáciu, žiadne experimenty!

---

## 🚀 Ako prepínať medzi databázami

### Prepnutie na DEV (bežné použitie)
```bash
cd backend
./switch-to-dev.sh
npm run dev
```

### Prepnutie na PROD (opatrne!)
```bash
cd backend
./switch-to-prod.sh  # Opýta sa na potvrdenie
npm run dev
```

### Alebo manuálne
```bash
# DEV
cp .env.development .env

# PROD
cp .env.production .env
```

---

## 📋 Workflow

### 1. Bežný vývoj (99% času)
```bash
cd backend
./switch-to-dev.sh
npm run dev

# Experimentuj, testuj, rob zmeny
# Production databáza je v bezpečí
```

### 2. Databázové migrácie
```bash
# Vytvor migráciu na DEV
cd backend
./switch-to-dev.sh
npx prisma migrate dev --name "add-new-feature"

# Test
npm run dev
# ... otestuj že funguje ...

# Aplikuj na PROD (len migráciu, nie data!)
./switch-to-prod.sh
npx prisma migrate deploy  # Bezpečné - len schéma
```

### 3. Backup pred zmenami
```bash
# Vždy backup PROD pred aplikovaním zmien
cd ~/Desktop/"Backups blackrent"

# Backup PROD
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv /opt/homebrew/opt/postgresql@16/bin/pg_dump \
  -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway \
  --no-owner --no-acl --clean --if-exists \
  -f "prod_backup_$(date +%Y-%m-%d_%H-%M-%S).sql"
```

---

## 🛡️ Bezpečnostné pravidlá

### ✅ VŽDY
- ✅ Vyvíjaj na DEV databáze
- ✅ Backup PROD pred zmenami
- ✅ Testuj na DEV pred aplikovaním na PROD
- ✅ Použi migračné skripty (nie manuálne SQL)

### ❌ NIKDY
- ❌ Nemodifikuj PROD priamo
- ❌ Nespúšťaj experimentálne queries na PROD
- ❌ Nemažež dáta bez backupu
- ❌ Necommituj .env súbory do gitu

---

## 📂 Súbory

```
backend/
├── .env                    ← Aktuálne použitá konfigurácia
├── .env.development        ← DEV databáza config
├── .env.production         ← PROD databáza config
├── switch-to-dev.sh        ← Helper script pre DEV
├── switch-to-prod.sh       ← Helper script pre PROD
└── DATABASE_SETUP.md       ← Tento súbor
```

---

## 🔍 Kontrola aktuálneho pripojenia

```bash
cd backend
head -10 .env | grep DB_HOST
# DEV: switchyard.proxy.rlwy.net
# PROD: trolley.proxy.rlwy.net
```

---

## 🆘 Troubleshooting

### Backend sa nepripája k databáze
```bash
# Over akú databázu používaš
head -10 .env

# Prepni na DEV
./switch-to-dev.sh

# Test pripojenia
npm run dev
```

### Omylom zmenil PROD dáta
```bash
# Obnov z backupu
cd ~/Desktop/"Backups blackrent"
# Použi najnovší backup

PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv /opt/homebrew/opt/postgresql@16/bin/psql \
  -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway \
  -f prod_backup_YYYY-MM-DD.sql
```

---

## ✅ Checklist

Po setup by si mal mať:
- [x] Railway DEV databáza vytvorená
- [x] Production dáta obnovené v DEV
- [x] `.env.development` nakonfigurovaný
- [x] `.env.production` nakonfigurovaný
- [x] Helper skripty vytvorené
- [x] Backend používa DEV databázu

---

## 🎉 Hotovo!

Teraz môžeš bezpečne vyvíjať bez strachu že pokazíš production databázu!

**Quick start:**
```bash
cd backend
./switch-to-dev.sh
npm run dev
```

**Dokumentácia backupov:** `~/Desktop/Backups blackrent/README.md`


