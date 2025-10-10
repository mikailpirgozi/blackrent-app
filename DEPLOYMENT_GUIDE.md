# 🚀 AUTH SYSTEM - DEPLOYMENT GUIDE

## ✅ **ČO JE HOTOVÉ (100%)**

Kompletný auth systém je implementovaný a pripravený na nasadenie!

---

## 📋 **QUICK START (3 KROKY)**

### **KROK 1: Spustiť Migráciu**
```bash
cd backend
npm run migrate:auth
```

**Čo to urobí:**
- Aktualizuje `users` tabuľku s novými stĺpcami
- Vytvorí `user_company_access` tabuľku
- Vytvorí `permission_templates` tabuľku
- Vytvorí `permission_audit_log` tabuľku
- Pridá indexy pre rýchlosť
- Vytvorí views pre jednoduchšie querying

### **KROK 2: Nasadiť Seed Data**
```bash
npm run seed:auth
```

**Čo to vytvorí:**
- **Super Admin** (vy)
  - Username: `superadmin`
  - Password: `SuperAdmin123!`
  - Prístup: VŠETKY firmy, VŠETKY dáta

- **BlackRent Admin**
  - Username: `blackrent_admin`
  - Password: `BlackRent123!`
  - Prístup: Len BlackRent dáta

- **Impresario Admin**
  - Username: `impresario_admin`
  - Password: `Impresario123!`
  - Prístup: Len Impresario dáta

- **Impresario Employee 1**
  - Username: `impresario_emp1`
  - Password: `Impresario123!`
  - Prístup: Impresario s custom permissions

- **Impresario Employee 2**
  - Username: `impresario_emp2`
  - Password: `Impresario223!`
  - Prístup: Impresario s custom permissions

### **KROK 3: Spustiť Testy**
```bash
npm run test:auth
```

**Čo to testuje:**
- ✅ Databázová schéma
- ✅ Super admin existuje
- ✅ Company admins existujú
- ✅ Employees majú permissions
- ✅ Permission templates
- ✅ User-company access links
- ✅ Role distribution
- ✅ Company assignments

---

## 🎯 **ALEBO VŠETKO NARAZ**

```bash
cd backend
npm run setup:auth
```

Tento príkaz spustí všetky 3 kroky automaticky!

---

## 🧪 **MANUÁLNE TESTOVANIE**

### **Test 1: Super Admin Login**
```bash
# Prihláste sa ako super admin
# URL: https://your-app.com/login
# Username: superadmin
# Password: SuperAdmin123!

# Skontrolujte:
# ✅ Vidíte všetky vozidlá (BlackRent + Impresario)
# ✅ Vidíte všetky firmy
# ✅ Môžete vytvárať používateľov
# ✅ Môžete upravovať permissions
```

### **Test 2: BlackRent Admin Login**
```bash
# Prihláste sa ako BlackRent admin
# URL: https://your-app.com/login
# Username: blackrent_admin
# Password: BlackRent123!

# Skontrolujte:
# ✅ Vidíte LEN BlackRent vozidlá
# ❌ NEVIDÍTE Impresario vozidlá
# ✅ Môžete upravovať BlackRent dáta
# ✅ Môžete vytvárať používateľov pre BlackRent
```

### **Test 3: Impresario Employee Login**
```bash
# Prihláste sa ako Impresario employee
# URL: https://your-app.com/login
# Username: impresario_emp1
# Password: Impresario123!

# Skontrolujte:
# ✅ Vidíte LEN Impresario vozidlá
# ❌ NEVIDÍTE BlackRent vozidlá
# ✅ Môžete vytvárať/upravovať rentals
# ❌ NEMÔŽETE mazať vozidlá (len read/write)
```

### **Test 4: Permission Update**
```bash
# Prihláste sa ako super admin
# Prejdite na User Management
# Vyberte Impresario Employee 1
# Zmeňte permissions (napr. pridajte delete na vehicles)
# Odhláste sa a prihláste ako impresario_emp1
# Skontrolujte že môžete teraz mazať vozidlá
```

---

## 🔐 **BEZPEČNOSŤ**

### **DÔLEŽITÉ: Zmeňte Heslá!**

Po prvom prihlásení **HNEĎ zmeňte všetky heslá**:

```bash
# V aplikácii prejdite na:
# Profile → Change Password
```

**Alebo použite tento endpoint:**
```bash
POST /api/auth/change-password
{
  "currentPassword": "SuperAdmin123!",
  "newPassword": "VaseNoveSilneHeslo123!"
}
```

### **Odporúčané Heslo Pravidlá:**
- Minimálne 12 znakov
- Obsahuje veľké a malé písmená
- Obsahuje čísla
- Obsahuje špeciálne znaky
- Nepoužívajte obvyklé slová

---

## 📊 **ROLE HIERARCHY**

```
┌─────────────────────────────────────────────┐
│         SUPER_ADMIN (Vy)                    │
│  ✅ Vidí všetky firmy                       │
│  ✅ Úplné práva všade                       │
│  ✅ Môže vytvárať company_admin             │
│  ✅ Môže upravovať všetky permissions       │
└─────────────────────────────────────────────┘
              │
              ├───────────────────────────────┐
              │                               │
┌─────────────▼───────────────┐ ┌─────────────▼───────────────┐
│ COMPANY_ADMIN (BlackRent)   │ │ COMPANY_ADMIN (Impresario)  │
│ ✅ Vidí len BlackRent       │ │ ✅ Vidí len Impresario      │
│ ✅ Úplné práva v BlackRent  │ │ ✅ Úplné práva v Impresario │
│ ✅ Môže vytvárať users      │ │ ✅ Môže vytvárať users      │
│ ❌ NEMÁ prístup k Impresario│ │ ❌ NEMÁ prístup k BlackRent │
└─────────────┬───────────────┘ └─────────────┬───────────────┘
              │                               │
        ┌─────┴─────┐                   ┌─────┴─────┐
        │           │                   │           │
        ▼           ▼                   ▼           ▼
  ┌─────────┐ ┌──────────┐      ┌──────────┐ ┌──────────┐
  │EMPLOYEE │ │COMPANY   │      │EMPLOYEE  │ │EMPLOYEE  │
  │         │ │OWNER     │      │   1      │ │   2      │
  └─────────┘ └──────────┘      └──────────┘ └──────────┘
```

---

## 🎨 **PERMISSION MATRIX**

| Resource    | super_admin | company_admin | company_owner | employee | mechanic | sales_rep |
|-------------|-------------|---------------|---------------|----------|----------|-----------|
| Vehicles    | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ RU    | ✅ R      |
| Rentals     | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ R     | ✅ CRU    |
| Expenses    | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ R     | ✅ R      |
| Settlements | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ R     | ❌       | ✅ R      |
| Customers   | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ R     | ✅ CRU    |
| Insurances  | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ R     | ✅ R     | ✅ R      |
| Maintenance | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ CRUD  | ❌        |
| Protocols   | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ CRU   | ✅ CRU   | ✅ CRU    |
| Statistics  | ✅ CRUD     | ✅ CRUD*      | ✅ R          | ✅ R     | ✅ R     | ✅ R      |

**Legend:** 
- ✅ = Má prístup
- ❌ = Nemá prístup
- C = Create
- R = Read
- U = Update
- D = Delete
- \* = Len vo vlastnej firme

---

## 🛠️ **TROUBLESHOOTING**

### **Problem: Migrácia zlyhá**
```bash
# Skontrolujte DATABASE_URL
echo $DATABASE_URL

# Skontrolujte či môžete pripojiť k DB
psql "$DATABASE_URL" -c "SELECT 1"

# Ak je problém, nastavte DATABASE_URL:
export DATABASE_URL='postgresql://user:password@host:port/database'
```

### **Problem: Seed zlyhá - user už existuje**
```bash
# To je OK! Seed script aktualizuje existujúcich používateľov
# Skontrolujte či sú vytvorení:
psql "$DATABASE_URL" -c "SELECT username, role FROM users WHERE role IN ('super_admin', 'company_admin')"
```

### **Problem: Nemôžem sa prihlásiť**
```bash
# 1. Skontrolujte či user existuje
psql "$DATABASE_URL" -c "SELECT username, role, is_active FROM users WHERE username = 'superadmin'"

# 2. Resetujte heslo (cez super admin endpoint)
curl -X GET https://your-api.com/api/auth/reset-admin-get

# 3. Skontrolujte logy v backendu
npm run dev
```

### **Problem: Vidím dáta ktoré by som nemal**
```bash
# Skontrolujte vašu rolu a companyId
# V aplikácii: Profile → My Info

# Skontrolujte permissions v databáze
psql "$DATABASE_URL" -c "
  SELECT u.username, u.role, u.company_id, c.name as company_name
  FROM users u
  LEFT JOIN companies c ON u.company_id = c.id
  WHERE u.username = 'your_username'
"
```

---

## 📞 **PODPORA**

### **Ak niečo nefunguje:**

1. **Skontrolujte logs:**
   ```bash
   # Backend logs
   npm run dev
   
   # Frontend logs  
   # Otvorte Browser DevTools → Console
   ```

2. **Spustite testy:**
   ```bash
   npm run test:auth
   ```

3. **Skontrolujte databázu:**
   ```bash
   psql "$DATABASE_URL"
   
   # V psql:
   \dt  # Zobrazí všetky tabuľky
   SELECT * FROM users LIMIT 5;
   SELECT * FROM user_company_access LIMIT 5;
   ```

4. **Debug specific user:**
   ```bash
   # Backend má debug endpoint:
   GET /api/auth/debug-company-owner
   GET /api/auth/test-permissions
   ```

---

## 🎉 **PO ÚSPEŠNOM NASADENÍ**

### **Checklist:**
- [ ] Všetci admin používatelia majú zmenené heslá
- [ ] Super admin má prístup ku všetkým firmám
- [ ] BlackRent admin vidí len BlackRent dáta
- [ ] Impresario admin vidí len Impresario dáta
- [ ] Impresario employees majú správne permissions
- [ ] Company owner účty sú nastavené (ak existujú)
- [ ] Audit log funguje (permission changes sa logujú)
- [ ] Cache sa invaliduje pri zmene permissions

### **Dokumentácia pre používateľov:**
1. Vytvorte user guide pre adminov
2. Vytvorte permission guide (kto čo môže)
3. Zdokumentujte proces vytvárania nových používateľov
4. Vytvorte FAQ pre bežné otázky

---

## 📈 **BUDÚCE ROZŠÍRENIA**

### **Už teraz podporované:**
- ✅ Multi-tenant (viac firiem)
- ✅ Granulárne permissions (resource-level)
- ✅ Audit trail (všetky zmeny)
- ✅ Permission templates (rýchle pridelenie)
- ✅ Cache invalidation (okamžité zmeny)

### **Možné budúce features:**
- 🔜 2FA (two-factor authentication)
- 🔜 IP whitelisting
- 🔜 Session management (force logout)
- 🔜 Password policies (expiry, strength)
- 🔜 Login attempt limiting
- 🔜 Email notifications (permission changes)

---

**Verzia:** 1.0  
**Dátum:** 2025-01-04  
**Status:** ✅ Production Ready  
**Implementované:** 100%

🎊 **GRATULUJEME! Váš auth systém je kompletný a pripravený na produkciu!** 🎊

