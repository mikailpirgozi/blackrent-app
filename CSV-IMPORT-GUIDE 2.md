# 📊 CSV Import návod pre PostgreSQL

## ✅ **Migrácia úspešná!** 

Vaša aplikácia teraz beží na **PostgreSQL databáze** a je pripravená na produkčné hosting.

## 🚀 **Aktuálny stav:**
- ✅ **Frontend:** http://localhost:3000 (React aplikácia)
- ✅ **Backend:** http://localhost:5001 (PostgreSQL API)
- ✅ **Databáza:** PostgreSQL s autentifikáciou
- ✅ **Admin prihlásenie:** `admin` / `admin123`

## 📁 **CSV Import funkcionalita**

### 🚗 **Import vozidiel**
```
Formát CSV súboru:
id,brand,model,licensePlate,company,cena_0_1,cena_2_3,cena_4_7,cena_8_14,cena_15_22,cena_23_30,cena_31_9999,commissionType,commissionValue,status

Príklad riadku:
1,"BMW","X5","BA-123-AB","Marko",50,45,40,35,30,25,20,"percentage",20,"available"
```

**Ako importovať:**
1. Otvorte http://localhost:3000
2. Prihláste sa: `admin` / `admin123`
3. Idite na **"Databáza vozidiel"**
4. Kliknite **"Import vozidiel"**
5. Vyberte váš CSV súbor

### 📋 **Import prenájmov** 
```
Formát CSV súboru:
id,licensePlate,customerName,startDate,endDate,totalPrice,commission,paymentMethod,discountType,discountValue,customCommissionType,customCommissionValue,extraKmCharge,paid,handoverPlace,confirmed

Príklad riadku:
1,"BA-123-AB","Ján Novák","14.1.","16.1.",200.00,40.00,"cash","","","","",,"1","Bratislava","1"
```

**📅 DÔLEŽITÉ - Formáty dátumov:**
- ✅ **"14.1."** - deň.mesiac (automaticky rok 2025)
- ✅ **"14.1.2025"** - deň.mesiac.rok
- ✅ **"2025-01-14T23:00:00.000Z"** - ISO 8601 formát

**Ako importovať:**
1. Otvorte http://localhost:3000
2. Idite na **"Prenájmy"**
3. Kliknite **"Import prenájmov"**
4. Vyberte váš CSV súbor
5. Ak vozidlo neexistuje, vytvorí sa automaticky ako "NEZNÁMA ZNAČKA"

### 💰 **Import nákladov**
```
Formát CSV súboru:
id,description,amount,date,vehicleLicensePlate,company,category,note

Príklad riadku:
1,"Tankovanie",85.50,"01/2025","BA-123-AB","OMV","fuel","Plná nádrž"
```

**Ako importovať:**
1. Otvorte http://localhost:3000
2. Idite na **"Náklady"**
3. Kliknite **"Import nákladov"**
4. Vyberte váš CSV súbor

## 🔄 **Spravovanie databáz**

### Prepínanie medzi databázami:
```bash
# PostgreSQL (odporúčané pre hosting)
./backend/switch-database.sh postgresql

# SQLite (len pre testovanie)
./backend/switch-database.sh sqlite

# Kontrola stavu
./backend/switch-database.sh status
```

### PostgreSQL zálohy:
```bash
# Vytvorenie zálohy
./backend/postgres-backup.sh backup

# Zobrazenie záloh
./backend/postgres-backup.sh list

# Obnovenie zálohy
./backend/postgres-backup.sh restore <backup-file>

# Porovnanie SQLite vs PostgreSQL
./backend/postgres-backup.sh compare
```

## 📊 **Testovanie CSV importu**

### 1. Vytvorte testovací CSV súbor vozidiel:
```csv
id,brand,model,licensePlate,company,cena_0_1,cena_2_3,cena_4_7,cena_8_14,cena_15_22,cena_23_30,cena_31_9999,commissionType,commissionValue,status
1,"BMW","X5","BA-001-AB","AutoRent",60,55,50,45,40,35,30,"percentage",20,"available"
2,"Audi","A4","BA-002-CD","AutoRent",50,45,40,35,30,25,20,"percentage",15,"available"
3,"Mercedes","C200","BA-003-EF","LuxuryCars",70,65,60,55,50,45,40,"fixed",50,"available"
```

### 2. Vytvorte testovací CSV súbor prenájmov:
```csv
id,licensePlate,customerName,startDate,endDate,totalPrice,commission,paymentMethod,discountType,discountValue,customCommissionType,customCommissionValue,extraKmCharge,paid,handoverPlace,confirmed
1,"BA-001-AB","Ján Novák","15.1.","17.1.",300.00,60.00,"cash","","","","",,"1","Bratislava","1"
2,"BA-002-CD","Mária Svobodová","20.1.","25.1.",500.00,75.00,"bank_transfer","percentage",10,"","",,"0","Košice","0"
3,"BA-003-EF","Peter Horváth","1.2.","5.2.",800.00,100.00,"vrp","","","fixed",20,50,"1","Prešov","1"
```

### 3. Importujte súbory cez aplikáciu

## 🎯 **Výhody PostgreSQL**

### Pre vás (lokálne):
- ✅ **Robustná databáza** - nepodlieha korrupcii
- ✅ **Lepšie výkonnost** pri viacerých používateľoch
- ✅ **Pokročilé funkcie** (indexy, views, triggers)
- ✅ **Automatické zálohy** s našimi scriptmi

### Pre hosting:
- ✅ **Enterprise-grade** - používajú to veľké firmy
- ✅ **Cloud podpora** - Heroku, AWS, DigitalOcean
- ✅ **Škálovateľnosť** - môže rásť s aplikáciou
- ✅ **Bezpečnosť** - ACID compliance

## 🔧 **Riešenie problémov**

### CSV import nefunguje:
1. **Skontrolujte prihlásenie:** admin/admin123
2. **Kontrola backend:** http://localhost:5001/health
3. **Reštart aplikácie:**
   ```bash
   # Zastavenie
   pkill -f "ts-node\|nodemon"
   
   # Spustenie
   cd backend && npm run dev
   ```

### Chyba "Cannot find module":
```bash
cd backend
npm install
npm run dev
```

### PostgreSQL nefunguje:
```bash
# Reštart PostgreSQL
brew services restart postgresql@14

# Kontrola stavu  
pg_isready
```

## 🚀 **Pripravené na hosting!**

Vaša aplikácia je teraz pripravená na nasadenie na:
- **Heroku** (backend + Heroku Postgres)
- **Railway** (backend + Railway PostgreSQL)
- **DigitalOcean** (Droplet + Managed Database)
- **Vercel/Netlify** (frontend) + **Supabase** (databáza)

---

**💡 Tip:** Pred nasadením na hosting otestujte všetky CSV importy lokálne! 