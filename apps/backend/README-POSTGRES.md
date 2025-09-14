# Blackrent Backend - PostgreSQL Systém

## 🚀 Prečo PostgreSQL namiesto SQLite?

### Problémy so SQLite:
- ❌ Databáza sa môže vymazať pri reštarte
- ❌ Hesla sa ukladajú ako plain text
- ❌ Nestabilné prihlasovanie
- ❌ Obmedzená súbežnosť
- ❌ Žiadne automatické zálohovanie

### Výhody PostgreSQL:
- ✅ Stabilná databáza - dáta sa nemazú pri reštarte
- ✅ Bezpečné hashovanie hesiel pomocou bcrypt
- ✅ Vysoká dostupnosť a spoľahlivosť
- ✅ Automatické zálohovanie
- ✅ Lepšia výkonnosť pri väčšom množstve dát

## 📦 Inštalácia

### 1. Automatická inštalácia (Odporúčané)
```bash
cd backend
npm run setup
```

### 2. Manuálna inštalácia

#### macOS (s Homebrew):
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. Vytvorenie databázy
```bash
# Vytvorenie databázy
psql -U postgres -c "CREATE DATABASE blackrent;"

# Vytvorenie používateľa
psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'password';"

# Pridelenie práv
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE blackrent TO postgres;"
```

### 4. Konfigurácia
```bash
# Skopírujte príklad konfigurácie
cp env.example .env

# Upravte .env súbor podľa potreby
```

## 🔑 Prihlásenie

Po prvom spustení sa automaticky vytvorí admin používateľ:

- **Username:** `admin`
- **Password:** `admin123`

## 🚀 Spustenie

```bash
# Vývojový režim
npm run dev

# Produkčný režim
npm run build
npm start
```

## 📊 Health Check

Overte, či server beží:
```bash
curl http://localhost:5001/health
```

Odpoveď:
```json
{
  "success": true,
  "message": "Blackrent API je funkčné",
  "database": "PostgreSQL",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔒 Bezpečnosť

### Hashovanie hesiel
- Všetky hesla sa hashujú pomocou bcrypt s 12 rounds
- Žiadne plain text hesla v databáze
- Automatické hashovanie pri vytváraní a aktualizácii používateľov

### JWT Tokeny
- 7-dňová platnosť tokenov
- Bezpečný JWT secret
- Automatické overenie na všetkých chránených endpointoch

## 🗄️ Databázová štruktúra

### Používatelia (users)
- UUID primárne kľúče
- Hashované hesla
- Role-based prístup (admin/user)

### Vozidlá (vehicles)
- JSONB pre ceny a provízie
- Referencie na firmy
- Stav vozidla (available/rented)

### Prenájmy (rentals)
- Komplexné vzťahy s vozidlami a zákazníkmi
- JSONB pre platby a históriu
- Automatické timestampy

## 🔄 Migrácia z SQLite

Ak máte existujúce dáta v SQLite:

1. Spustite PostgreSQL backend
2. Dáta sa automaticky vytvoria
3. Manuálne skopírujte potrebné dáta

## 🛠️ Údržba

### Zálohovanie
```bash
# Automatické zálohy každých 24 hodín
# Zálohy sa ukladajú do priečinka backups/
```

### Monitoring
```bash
# Kontrola stavu databázy
psql -U postgres -d blackrent -c "SELECT version();"

# Kontrola používateľov
psql -U postgres -d blackrent -c "SELECT username, role, created_at FROM users;"
```

## 🐛 Riešenie problémov

### Chyba pripojenia k databáze
```bash
# Kontrola či PostgreSQL beží
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql@14   # macOS
sudo systemctl restart postgresql     # Linux
```

### Chyba autentifikácie
```bash
# Reset hesla pre admin
psql -U postgres -d blackrent -c "UPDATE users SET password_hash = '\$2a\$12\$...' WHERE username = 'admin';"
```

## 📞 Podpora

Pre technickú podporu kontaktujte vývojový tím. 