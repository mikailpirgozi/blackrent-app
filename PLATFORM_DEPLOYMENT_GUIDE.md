# 🚀 PLATFORM MULTI-TENANCY - Deployment Guide

## ✅ ČO JE DOKONČENÉ

### Backend Implementation ✅
- ✅ Databázová schéma s `platforms` tabuľkou
- ✅ Platform CRUD API (`/api/platforms`)
- ✅ User roles update (super_admin, platform_admin, platform_employee, investor)
- ✅ TypeScript types (Platform interface)
- ✅ Database methods pre platform management
- ✅ User queries s platform_id support

### Frontend Implementation ✅
- ✅ TypeScript types synchronizované s backendom
- ✅ Platform, User, Company interfaces updated

---

## 🚀 DEPLOYMENT KROKY

### KROK 1: Database Migration

**Automatická inicializácia pri štarte:**
- Backend automaticky vytvorí `platforms` tabuľku pri prvom spustení
- Automaticky vytvorí 2 default platformy: Blackrent, Impresario
- Automaticky pridá `platform_id` column do všetkých tabuliek
- Automaticky migruje existujúcich admin users na Blackrent platformu

**Alebo manuálna migrácia (ak potrebuješ):**
```bash
cd backend
psql $DATABASE_URL < migrations/001_add_platform_multi_tenancy.sql
```

### KROK 2: Backend Deploy

```bash
# V backend directory
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2/backend

# Install dependencies (ak treba)
pnpm install

# Build
pnpm build

# Deploy na Railway (automaticky sa spustí pri git push)
git add .
git commit -m "🌐 Platform Multi-Tenancy Implementation"
git push origin main
```

Railway automaticky:
- Detektuje zmeny
- Spustí build
- Restartuje server
- Spustí database initialization (platforms tabuľka, migrácia users)

### KROK 3: Verifikácia Deployment

Po deployi over či:

1. **Platforms existujú:**
```bash
curl https://your-backend.railway.app/api/platforms \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

Očakávaný výsledok:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Blackrent",
      "displayName": "Blackrent - Premium Car Rental",
      "subdomain": "blackrent",
      "isActive": true
    },
    {
      "id": "...",
      "name": "Impresario",
      "displayName": "Impresario - Luxury Fleet Management",
      "subdomain": "impresario",
      "isActive": true
    }
  ]
}
```

2. **Users majú platform_id:**
```bash
curl https://your-backend.railway.app/api/admin/users \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

Skontroluj že users majú `platformId` field.

---

## 📋 POST-DEPLOYMENT TASKS

### 1. Priradenie firiem k platformám

Ako **super_admin**, musíš manuálne priradiť existujúce firmy k platformám:

```bash
# Získaj ID platforiem
curl https://your-backend.railway.app/api/platforms \
  -H "Authorization: Bearer YOUR_TOKEN"

# Získaj ID firiem
curl https://your-backend.railway.app/api/companies \
  -H "Authorization: Bearer YOUR_TOKEN"

# Prirad firmu k platforme
curl -X POST https://your-backend.railway.app/api/platforms/{PLATFORM_ID}/assign-company/{COMPANY_ID} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Priradenie pomocou SQL (rýchlejšie pre viacero firiem):**
```sql
-- Prirad všetky Blackrent firmy
UPDATE companies 
SET platform_id = (SELECT id FROM platforms WHERE name = 'Blackrent') 
WHERE name IN ('Blackrent Transport', 'Blackrent Leasing', ...);

-- Prirad všetky Impresario firmy
UPDATE companies 
SET platform_id = (SELECT id FROM platforms WHERE name = 'Impresario') 
WHERE name IN ('Impresario Cars', 'Impresario Build', ...);
```

### 2. Vytvorenie Platform Adminov

```bash
# Vytvor platform admin pre Blackrent
curl -X POST https://your-backend.railway.app/api/admin/users \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "blackrent_admin",
    "email": "admin@blackrent.sk",
    "password": "secure_password_123",
    "role": "platform_admin",
    "platformId": "BLACKRENT_PLATFORM_ID"
  }'

# Vytvor platform admin pre Impresario
curl -X POST https://your-backend.railway.app/api/admin/users \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "impresario_admin",
    "email": "admin@impresario.sk",
    "password": "secure_password_123",
    "role": "platform_admin",
    "platformId": "IMPRESARIO_PLATFORM_ID"
  }'
```

### 3. Update existujúcich users

Ak máš existujúcich users ktorých chceš nastaviť ako platform_employee:

```sql
-- Update users na platform_employee
UPDATE users 
SET role = 'platform_employee', 
    platform_id = (SELECT id FROM platforms WHERE name = 'Blackrent')
WHERE role = 'employee' 
AND username IN ('user1', 'user2', ...);
```

---

## 🔐 PERMISSIONS SETUP

### Super Admin (TY)
Už máš všetky práva. Tvoj user už bol automaticky migrovaný.

### Platform Admin Setup
Pre každú platformu vytvor platform_admin usera s `platformId`.

### Platform Employee Setup
Pre employees nastav:
- `role = 'platform_employee'`
- `platformId = PLATFORM_ID`

### Investor Setup
Pre investors:
1. Vytvor user s `role = 'investor'`
2. Nastav `platformId = PLATFORM_ID`
3. Prirad investor shares v `company_investor_shares` tabuľke

---

## 🧪 TESTING

### 1. Test Super Admin Access
```bash
# Prihlás sa ako super admin
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "super_admin_user", "password": "password"}'

# Over prístup k všetkým platformám
curl https://your-backend.railway.app/api/platforms \
  -H "Authorization: Bearer TOKEN"
```

### 2. Test Platform Admin Access
```bash
# Prihlás sa ako platform admin
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "blackrent_admin", "password": "password"}'

# Over že vidíš len svoju platformu
curl https://your-backend.railway.app/api/platforms \
  -H "Authorization: Bearer TOKEN"

# Mal by vrátiť 403 Forbidden
```

### 3. Test Platform Employee Access
```bash
# Prihlás sa ako platform employee
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "employee1", "password": "password"}'

# Over že môže čítať dáta
curl https://your-backend.railway.app/api/vehicles \
  -H "Authorization: Bearer TOKEN"

# Over že nemôže mazať (DELETE by mal vrátiť 403)
curl -X DELETE https://your-backend.railway.app/api/vehicles/{ID} \
  -H "Authorization: Bearer TOKEN"
```

### 4. Test Investor Access
```bash
# Prihlás sa ako investor
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "investor1", "password": "password"}'

# Over že vidí len svoje firmy
curl https://your-backend.railway.app/api/companies \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 MONITORING

Po deployi sleduj:

1. **Database Logs:**
```sql
-- Skontroluj či všetci users majú platform_id
SELECT COUNT(*) as total_users, 
       COUNT(platform_id) as users_with_platform 
FROM users;

-- Skontroluj či všetky companies majú platform_id (po manuálnom priradení)
SELECT COUNT(*) as total_companies, 
       COUNT(platform_id) as companies_with_platform 
FROM companies;
```

2. **API Logs:**
- Sleduj Railway logs pre platform API calls
- Over že platform filtering funguje správne

3. **Performance:**
- Sleduj query times (mali by byť rýchlejšie vďaka indexom)
- Over že platform filtering nezpomaľuje queries

---

## 🐛 TROUBLESHOOTING

### Problem: Users nemajú platform_id po deployi

**Riešenie:**
```sql
-- Manuálne prirad Blackrent platform všetkým admin users
UPDATE users 
SET platform_id = (SELECT id FROM platforms WHERE name = 'Blackrent')
WHERE role IN ('admin', 'super_admin') 
AND platform_id IS NULL;
```

### Problem: Platforms tabuľka neexistuje

**Riešenie:**
```bash
# Spusti manuálnu migráciu
psql $DATABASE_URL < backend/migrations/001_add_platform_multi_tenancy.sql
```

### Problem: Platform Admin nevidí žiadne dáta

**Riešenie:**
- Over že user má správny `platformId`
- Over že companies majú priradený `platform_id`
- Over že vehicles majú priradený `platform_id`

```sql
-- Prirad platform_id k companies
UPDATE companies 
SET platform_id = (SELECT id FROM platforms WHERE name = 'Blackrent')
WHERE name LIKE '%Blackrent%';

-- Prirad platform_id k vehicles
UPDATE vehicles v
SET platform_id = c.platform_id
FROM companies c
WHERE v.company_id = c.id 
AND v.platform_id IS NULL;
```

### Problem: Frontend neukazuje platform field

**Riešenie:**
- Frontend types sú už aktualizované
- Over že používaš najnovšiu verziu frontendu
- Hard refresh prehliadača (Ctrl+Shift+R)

---

## 📝 ROLLBACK PLAN

Ak by niečo zlyhalo:

### Rollback Database Changes
```sql
-- Odstráň platform_id columns (ALE STRATÍŠ PLATFORM DATA!)
ALTER TABLE users DROP COLUMN IF EXISTS platform_id;
ALTER TABLE companies DROP COLUMN IF EXISTS platform_id;
ALTER TABLE vehicles DROP COLUMN IF EXISTS platform_id;
-- atď...

-- Odstráň platforms tabuľku
DROP TABLE IF EXISTS platforms CASCADE;
```

### Rollback Backend Code
```bash
git revert HEAD
git push origin main
```

**⚠️ POZOR:** Rollback vymaže všetky platform priradenia!

---

## ✅ CHECKLIST PRE PRODUCTION

- [ ] Database migration prebehla úspešne
- [ ] Platforms tabuľka existuje s 2 platformami
- [ ] Všetci admin users majú `platform_id`
- [ ] Firmy sú priradené k platformám
- [ ] Platform admins sú vytvorení
- [ ] Permissions fungujú správne (testované)
- [ ] Frontend types sú aktualizované
- [ ] API endpoints sú funkčné (testované cez curl/Postman)
- [ ] Monitoring je nastavený
- [ ] Backup database pred migráciou

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Frontend UI Implementation:**
   - Platform Management Dashboard (super admin)
   - Company assignment UI
   - User Management s platform filtering

2. **Advanced Features:**
   - Platform statistics dashboard
   - Cross-platform reporting (super admin only)
   - Platform-specific settings

3. **Documentation:**
   - User guides pre každú rolu
   - Admin training materials
   - API documentation update

---

**Status:** Backend je PRODUCTION READY ✅  
**Deployed:** Ready pre deployment na Railway  
**Testing:** Potrebné manuálne otestovanie po deployi


