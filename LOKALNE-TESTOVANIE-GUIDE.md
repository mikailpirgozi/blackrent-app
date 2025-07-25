# Sprievodca lokálnym testovaním s produkčnými dátami

Tento sprievodca vám pomôže nastaviť lokálne vývojové prostredie s rovnakými dátami ako v produkcii.

## 🎯 Účel

**Problém:** Vo vašom lokálnom prostredí máte inú databázu ako v produkcii, čo spôsobuje:
- Varovania typu "Vozidlo so ŠPZ sa nenašlo v databáze"
- Zobrazovanie "Neznáma značka Neznámy model N/A"
- Problémy pri testovaní s reálnymi dátami

**Riešenie:** Synchronizácia produkčných dát do lokálnej PostgreSQL databázy.

## 🛠️ Príprava prostredia

### 1. Inštalácia PostgreSQL (ak nie je nainštalovaná)

**MacOS (Homebrew):**
```bash
# Inštalácia PostgreSQL
brew install postgresql

# Spustenie služby
brew services start postgresql

# Vytvorenie používateľa (ak neexistuje)
createuser -s postgres
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Vytvorenie lokálnej databázy

```bash
# Pripojenie ako postgres užívateľ
sudo -u postgres psql

# V PostgreSQL konzole:
CREATE DATABASE blackrent;
CREATE USER postgres WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE blackrent TO postgres;
\q
```

### 3. Overenie pripojenia

```bash
psql -h localhost -U postgres -d blackrent -c "SELECT version();"
```

## 🔄 Synchronizácia s produkciou

### Spustenie automatickej synchronizácie

```bash
# Spustite skript zo root adresára projektu
./sync-production-db.sh
```

### Čo skript robí:

1. **Stiahne dáta z produkcie** - pripojí sa na Railway PostgreSQL
2. **Vyčistí lokálnu databázu** - odstráni existujúce dáta
3. **Importuje produkčné dáta** - skopíruje všetky tabuľky a dáta
4. **Nakonfiguruje prostredie** - vytvorí `.env` súbor pre backend
5. **Overí import** - zobrazí počet záznamov v tabuľkách

### Výstup skriptu:

```
🔄 Synchronizácia produkčnej databázy s lokálnou...
✅ Lokálna PostgreSQL je dostupná
📥 Sťahujem dáta z produkčnej databázy...
✅ Produkčné dáta úspešne stiahnuté
🗑️ Čistím lokálnu databázu...
📤 Importujem produkčné dáta do lokálnej databázy...
✅ Dáta úspešne importované

📊 Počet záznamov v tabuľkách:
   vehicles: 25 záznamov
   customers: 150 záznamov
   rentals: 85 záznamov
   companies: 8 záznamov
   users: 3 záznamov

🎉 Synchronizácia dokončená úspešne!
```

## 🚀 Spustenie aplikácie

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend sa spustí na `http://localhost:3001` a pripojí sa na lokálnu PostgreSQL.

### 2. Frontend

```bash
# V root adresári
npm install
npm start
```

Frontend sa spustí na `http://localhost:3000` a pripojí sa na lokálny backend.

## ✅ Overenie funkčnosti

### Testovanie vyhľadávania vozidiel:

1. **Otvorte EmailParser** v prenájmoch
2. **Zadajte text s ŠPZ** (napr. "AA677EP")
3. **Skontrolujte** - už by sa nemalo zobrazovať varovanie
4. **Vytvorte prenájom** - vozidlo by sa malo správne nájsť

### Kontrola zobrazenia vozidiel:

1. **Otvorte zoznam prenájmov**
2. **Skontrolujte** - namiesto "Neznáma značka" by sa mali zobrazovať správne údaje
3. **Refreshnite stránku** - údaje by mali zostať správne

## 🔧 Konfigurácia

### Backend `.env` súbor (vytvorí sa automaticky):

```env
# Lokálna PostgreSQL databáza - synchronizovaná s produkciou
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=blackrent-super-secret-jwt-key-2024
PORT=3001
NODE_ENV=development
VERSION=1.0.0-sync
```

### Frontend konfigurácia:

Frontend automaticky používa `http://localhost:3001/api` v development režime (nastavené v `src/services/api.ts`).

## 🔄 Opätovná synchronizácia

Pre získanie najnovších dát z produkcie:

```bash
./sync-production-db.sh
```

**Poznámka:** Toto vymaže všetky lokálne zmeny v databáze a nahradí ich produkčnými dátami.

## 📊 Monitoring a debugging

### Kontrola pripojenia k databáze:

```bash
# Pripojenie na lokálnu databázu
psql -h localhost -U postgres -d blackrent

# Zobrazenie tabuliek
\dt

# Počet záznamov
SELECT COUNT(*) FROM vehicles;
SELECT COUNT(*) FROM rentals;

# Ukončenie
\q
```

### Debug logs v aplikácii:

V browser console by ste mali vidieť:
```
✅ Parsed vehicle: { name: "BMW X5", code: "AA677EP", price: 120 }
🔍 Vehicle search details: { searchingFor: "AA677EP", normalized: "AA677EP", found: true }
```

## 🚨 Riešenie problémov

### Chyba: "Lokálna PostgreSQL nie je dostupná"

```bash
# Spustenie PostgreSQL
brew services start postgresql

# Alebo na Ubuntu:
sudo systemctl start postgresql
```

### Chyba: "Databáza blackrent neexistuje"

```bash
createdb -U postgres blackrent
```

### Chyba: "Connection refused"

Skontrolujte, či PostgreSQL beží:
```bash
brew services list | grep postgresql
# alebo
sudo systemctl status postgresql
```

### Backend sa nepripája na lokálnu databázu

Skontrolujte `backend/.env` súbor a overte údaje:
```bash
cat backend/.env
```

## 📝 Backup súbory

Skript automaticky zálohuje produkčné dáta do:
```
./db-sync-backups/production-backup-YYYY-MM-DD_HH-MM-SS.sql
```

Staré backupy (starší ako 7 dní) sa automaticky mažú.

## 🔐 Bezpečnosť

- Skript číta iba dáta z produkcie (žiadne zmeny)
- Lokálna databáza nie je prístupná zvonka
- Backup súbory obsahujú citlivé dáta - nezdieľajte ich

## 💡 Tipy

1. **Pravidelná synchronizácia:** Spúšťajte skript pravidelne pre aktuálne dáta
2. **Testovanie:** Lokálne zmeny v databáze sa stratia pri ďalšej synchronizácii
3. **Development:** Pre trvalé zmeny upravujte migration scripty v backende
4. **Production:** Nikdy nespúšťajte tento skript na produkčnom serveri

---

*Posledná aktualizácia: $(date)* 