# Blackrent - Produkčné nasadenie s PostgreSQL

## Prečo PostgreSQL pre hosting?

PostgreSQL je enterprise-grade databáza, ktorá je ideálna pre produkčné nasadenie:

✅ **Produkčná stabilita** - Overená databáza pre kritické aplikácie  
✅ **Súbežnosť** - Zvláda viac používateľov naraz  
✅ **Backup a recovery** - Pokročilé zálohovanie  
✅ **Škálovateľnosť** - Môže rásť s aplikáciou  
✅ **Hosting podpora** - Väčšina hostingov podporuje PostgreSQL  
✅ **ACID compliance** - Garantuje integritu dát  

## Aktuálny stav aplikácie

Aplikácia je pripravená na PostgreSQL s:
- ✅ Autentifikáciou (JWT)
- ✅ RESTful API
- ✅ TypeScript backend
- ✅ React frontend
- ✅ Automatické vytvorenie tabuliek
- ✅ Admin používateľ (admin/admin123)

## Lokálne testovanie

### 1. Spustenie PostgreSQL
```bash
# macOS s Homebrew
brew services start postgresql@14

# Vytvorenie databázy
createdb blackrent
```

### 2. Konfigurácia
```bash
cd backend
cp env.example .env
# Upravte .env súbor podľa potreby
```

### 3. Spustenie aplikácie
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (v novom termináli)
npm install
npm start
```

### 4. Prihlásenie
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`

## Hosting nasadenie

### Backend hosting (napr. Heroku, Railway, DigitalOcean)

1. **Environment premenné:**
```bash
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=blackrent
DB_USER=your-username
DB_PASSWORD=your-password
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
PORT=5001
```

2. **Build a spustenie:**
```bash
npm install
npm run build
npm start
```

### Frontend hosting (napr. Vercel, Netlify)

1. **Build aplikácie:**
```bash
npm run build
```

2. **Environment premenné:**
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
```

3. **Nasadenie:**
- Upload `build` priečinka na hosting
- Nastavte environment premenné

### PostgreSQL hosting

**Odporúčané služby:**
- **Supabase** (free tier)
- **Railway** (free tier)
- **Heroku Postgres**
- **DigitalOcean Managed Databases**

**Príklad Supabase:**
1. Vytvorte projekt na supabase.com
2. Získajte connection string
3. Nastavte environment premenné

## Bezpečnosť

### Produkčné nastavenia

1. **Silné heslo pre admin:**
```sql
UPDATE users SET password_hash = 'new-hashed-password' WHERE username = 'admin';
```

2. **JWT Secret:**
```bash
# Vygenerujte silný secret
openssl rand -base64 32
```

3. **HTTPS:**
- Vždy používajte HTTPS v produkcii
- Nastavte CORS pre vašu doménu

4. **Rate limiting:**
- Implementujte rate limiting pre API
- Obmedzte počet požiadaviek

## Backup a monitoring

### Automatické zálohovanie
```bash
# Denné zálohy
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Monitoring
- Nastavte uptime monitoring
- Logovanie chýb
- Metriky výkonu

## Migrácia z SQLite

Ak máte dáta v SQLite:

1. **Export SQLite dát:**
```bash
sqlite3 blackrent.db ".dump" > sqlite_dump.sql
```

2. **Import do PostgreSQL:**
```bash
psql $DATABASE_URL < sqlite_dump.sql
```

## Troubleshooting

### Časté problémy

1. **Connection refused:**
- Skontrolujte DB_HOST a DB_PORT
- Overte, či PostgreSQL beží

2. **Authentication failed:**
- Skontrolujte DB_USER a DB_PASSWORD
- Overte, či používateľ má prístup k databáze

3. **CORS errors:**
- Nastavte správne CORS origins
- Overte API URL v frontend

### Logy
```bash
# Backend logy
npm run dev 2>&1 | tee backend.log

# PostgreSQL logy
tail -f /var/log/postgresql/postgresql-14-main.log
```

## Výkon

### Optimalizácie

1. **Indexy:**
```sql
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX idx_rentals_start_date ON rentals(start_date);
```

2. **Connection pooling:**
- PostgreSQL backend už má connection pooling
- Nastavte max connections podľa potreby

3. **Caching:**
- Implementujte Redis pre caching
- Cache často používané dáta

## Podpora

Pre otázky a problémy:
- Skontrolujte logy
- Overte environment premenné
- Testujte lokálne pred nasadením 