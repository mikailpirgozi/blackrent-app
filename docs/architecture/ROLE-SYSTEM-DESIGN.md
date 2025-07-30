# 🔐 ROLE-BASED PERMISSIONS SYSTÉM - DETAILNÝ NÁVRH

## 📋 1. DEFINÍCIA ROLÍ

### 🎭 Role Hierarchy:
```
👑 ADMIN           - Mikail (majiteľ) - všetko
👔 EMPLOYEE        - Zamestnanci - prenájmy, zákazníci, limitované financie  
🎒 TEMP_WORKER     - Brigádnici - protokoly, dochádzka
🔧 MECHANIC        - Mechanici - údržba, opravy, QR scan
💼 SALES_REP       - Obchodníci - CRM, leads, cenníky
🏢 COMPANY_OWNER   - Majitelia aut - len svoje vozidlá a súvisiace dáta
```

## 🗃️ 2. DATABÁZOVÁ ŠTRUKTÚRA

### 📝 2.1 Rozšírenie `users` tabuľky:
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS employee_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS permissions JSONB;

-- Aktualizácia role enum
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM (
  'admin',
  'employee', 
  'temp_worker',
  'mechanic',
  'sales_rep',
  'company_owner'
);

ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role;
```

### 🏢 2.2 Nová `companies` tabuľka:
```sql
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  business_id VARCHAR(50), -- IČO
  tax_id VARCHAR(50),      -- DIČ
  address TEXT,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  contract_start_date DATE,
  contract_end_date DATE,
  commission_rate DECIMAL(5,2) DEFAULT 20.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🚗 2.3 Rozšírenie `vehicles` tabuľky:
```sql
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS owner_company_id UUID REFERENCES companies(id),
ADD COLUMN IF NOT EXISTS assigned_mechanic_id UUID REFERENCES users(id);
```

## 🔐 3. PERMISSION SYSTÉM

### 📊 3.1 Permission Matrix:
```typescript
interface Permission {
  resource: 'vehicles' | 'rentals' | 'customers' | 'finances' | 'users' | 'companies' | 'maintenance';
  actions: ('read' | 'create' | 'update' | 'delete')[];
  conditions?: {
    ownOnly?: boolean;        // len vlastné záznamy
    companyOnly?: boolean;    // len firma vlastníka
    maxAmount?: number;       // finančný limit
    approvalRequired?: boolean; // vyžaduje schválenie
    readOnlyFields?: string[]; // read-only polia
  };
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { resource: '*', actions: ['read', 'create', 'update', 'delete'] }
  ],
  
  employee: [
    { resource: 'vehicles', actions: ['read', 'update'] },
    { resource: 'rentals', actions: ['read', 'create', 'update'] },
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'finances', actions: ['read'], conditions: { readOnlyFields: ['profit', 'netIncome'] } }
  ],
  
  temp_worker: [
    { resource: 'rentals', actions: ['read'], conditions: { ownOnly: true } },
    { resource: 'protocols', actions: ['create', 'update'], conditions: { ownOnly: true } }
  ],
  
  mechanic: [
    { resource: 'vehicles', actions: ['read', 'update'], conditions: { ownOnly: true } },
    { resource: 'maintenance', actions: ['read', 'create', 'update'] },
    { resource: 'finances', actions: ['create'], conditions: { maxAmount: 500 } }
  ],
  
  sales_rep: [
    { resource: 'customers', actions: ['read', 'create', 'update'] },
    { resource: 'rentals', actions: ['read', 'create'] },
    { resource: 'pricing', actions: ['read'] }
  ],
  
  company_owner: [
    { resource: 'vehicles', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'rentals', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'finances', actions: ['read'], conditions: { companyOnly: true } },
    { resource: 'insurances', actions: ['read'], conditions: { companyOnly: true } }
  ]
};
```

## 🛠️ 4. IMPLEMENTAČNÉ KROKY

### 📝 Krok 1: Backend Types
- ✅ Rozšíriť UserRole enum
- ✅ Pridať Company interface
- ✅ Aktualizovať User interface
- ✅ Vytvoriť Permission interfaces

### 🗃️ Krok 2: Databáza  
- ✅ Migrácia users tabuľky
- ✅ Vytvorenie companies tabuľky
- ✅ Aktualizácia vehicles tabuľky
- ✅ Pridanie foreign keys

### ⚙️ Krok 3: Backend API
- ✅ Permission middleware
- ✅ Company management endpoints
- ✅ User management rozšírenie
- ✅ Data filtering podľa rolí

### 🎨 Krok 4: Frontend
- ✅ Permission guards pre komponenty
- ✅ Role-aware navigation
- ✅ User management UI
- ✅ Company management UI

### 🧪 Krok 5: Testing
- ✅ Unit testy pre permissions
- ✅ Integration testy pre každú rolu
- ✅ UI testy pre visibility
- ✅ Security testy

## 🎯 5. TESTOVACÍ SCENÁR

### 👑 Admin test:
- Vidí všetko
- Môže upravovať všetko
- Môže vytvárať používateľov

### 🏢 Company Owner test:  
- Firma "Marko" s 3 autami
- Vidí len svoje autá a súvisiace dáta
- Nemôže vidieť dáta iných firiem

### 👔 Employee test:
- Vidí všetky prenájmy a zákazníkov
- Nemôže vidieť ziskové údaje
- Môže vytvárať protokoly

### 🔧 Mechanic test:
- Vidí len priradené autá
- Môže zaznamenávať prácu
- Môže zadať náklady do 500€

## 📊 6. DASHBOARD VIEWS PO ROLÁCH

### 👑 Admin Dashboard:
- KPI všetkých firiem
- Celkové financie
- User management
- System settings

### 🏢 Company Owner Dashboard:
- KPI len svojich vozidiel
- Svoje financie a vyúčtovania
- Historie prenájmov svojich áut
- Poistné udalosti svojich áut

### 👔 Employee Dashboard:
- Aktívne prenájmy
- Rezervácie na dnes
- Pending protokoly
- Zákazníci

### 🔧 Mechanic Dashboard:
- Priradené vozidlá
- Plánovaná údržba
- Work orders
- Time tracking

Toto je detailný návrh pre Fázu 1. Súhlasíš s týmto prístupom? 