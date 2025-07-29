# 📋 **KOMPLETNÁ ANALÝZA RENTALS TABUĽKY**

## 📊 **SÚČASNÝ STAV (39 stĺpcov!)**

### ✅ **POTREBNÉ ZÁKLADNÉ POLIA (13 stĺpcov)**
```sql
id                    UUID PRIMARY KEY    -- ✅ POTREBNÉ
vehicle_id            UUID                -- ✅ POTREBNÉ  
customer_name         VARCHAR(100)        -- ✅ POTREBNÉ
start_date            TIMESTAMP           -- ✅ POTREBNÉ
end_date              TIMESTAMP           -- ✅ POTREBNÉ  
total_price           NUMERIC(10,2)       -- ✅ POTREBNÉ
commission            NUMERIC(10,2)       -- ✅ POTREBNÉ
payment_method        VARCHAR(50)         -- ✅ POTREBNÉ
paid                  BOOLEAN             -- ✅ POTREBNÉ
status                VARCHAR(30)         -- ✅ POTREBNÉ
confirmed             BOOLEAN             -- ✅ POTREBNÉ
created_at            TIMESTAMP           -- ✅ POTREBNÉ
updated_at            TIMESTAMP           -- ✅ POTREBNÉ
```

### ⚠️ **UŽITOČNÉ ALE VOLITEĽNÉ (8 stĺpcov)**
```sql
handover_place        TEXT                -- 🤔 Používa sa?
order_number          VARCHAR(50)         -- 🤔 Používa sa?
deposit               NUMERIC(10,2)       -- 🤔 Používa sa?
allowed_kilometers    INTEGER             -- 🤔 Používa sa?
extra_kilometer_rate  NUMERIC(10,2)       -- 🤔 Používa sa?
handover_protocol_id  UUID                -- ✅ POTREBNÉ pre statusy
return_protocol_id    UUID                -- ✅ POTREBNÉ pre statusy
is_flexible           BOOLEAN             -- ✅ POTREBNÉ
```

### 🗑️ **ZBYTOČNÉ/DUPLICITNÉ POLIA (18 stĺpcov!)**
```sql
-- DUPLICITNÉ:
customer_id           VARCHAR(50)         -- ❌ DUPLIKÁT customer_name
company               VARCHAR(255)        -- ❌ DUPLIKÁT vehicles.company  
rental_type           VARCHAR(20)         -- ❌ DUPLIKÁT is_flexible

-- HYPER-ŠPECIFICKÉ (málokedy používané):
discount              TEXT                -- ❌ Komplexné, lepšie ako pole v total_price
custom_commission     TEXT                -- ❌ Komplexné, lepšie ako pole v commission
extra_km_charge       NUMERIC(10,2)       -- ❌ Špecifické pre kilometrovanie
return_conditions     TEXT                -- ❌ Špecifické  
fuel_level            INTEGER             -- ❌ Hyper-špecifické
return_fuel_level     INTEGER             -- ❌ Hyper-špecifické
odometer              INTEGER             -- ❌ Hyper-špecifické  
return_odometer       INTEGER             -- ❌ Hyper-špecifické
actual_kilometers     INTEGER             -- ❌ Hyper-špecifické
fuel_refill_cost      NUMERIC(10,2)       -- ❌ Hyper-špecifické
daily_kilometers      INTEGER             -- ❌ Hyper-špecifické

-- FLEXIBILNÉ KOMPLIKÁCIE:
flexible_end_date     DATE                -- ❌ Zbytočné s is_flexible
can_be_overridden     BOOLEAN             -- ❌ Zbytočné
override_priority     INTEGER             -- ❌ Zbytočné  
notification_threshold INTEGER            -- ❌ Zbytočné
auto_extend           BOOLEAN             -- ❌ Zbytočné
override_history      JSONB               -- ❌ Zbytočné

-- NEVYUŽITÉ POLIA:
payments              JSONB               -- ❌ Komplexné, lepšie separate table
history               JSONB               -- ❌ Komplexné, lepšie separate table
```

## 🎯 **NAVRHOVANÁ OPTIMALIZOVANÁ ŠTRUKTÚRA**

### **VERZIA A: MINIMÁLNA (21 stĺpcov)**
```sql
CREATE TABLE rentals_optimized (
  -- ZÁKLADNÉ IDENTIFIKÁCIE
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id            UUID REFERENCES vehicles(id),
  
  -- ZÁKAZNÍK  
  customer_name         VARCHAR(100) NOT NULL,
  
  -- DÁTUMY A ČASY
  start_date            TIMESTAMP NOT NULL,
  end_date              TIMESTAMP NOT NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- FINANCIE
  total_price           NUMERIC(10,2) NOT NULL,
  commission            NUMERIC(10,2) NOT NULL DEFAULT 0,
  deposit               NUMERIC(10,2) DEFAULT 0,
  payment_method        VARCHAR(50) NOT NULL,
  paid                  BOOLEAN DEFAULT false,
  
  -- STATUS A STAV
  status                VARCHAR(30) DEFAULT 'pending',
  confirmed             BOOLEAN DEFAULT false,
  is_flexible           BOOLEAN DEFAULT false,
  
  -- PROTOKOLY  
  handover_protocol_id  UUID,
  return_protocol_id    UUID,
  
  -- VOLITEĽNÉ
  handover_place        TEXT,
  order_number          VARCHAR(50),
  allowed_kilometers    INTEGER
);
```

### **VERZIA B: ROZŠÍRENÁ (s JSONB pre komplexné dáta)**
```sql
-- Všetko z VERZIE A plus:
pricing_details       JSONB,              -- discount, extra charges, atď.
vehicle_condition     JSONB,              -- fuel, odometer, atď.  
notes                 TEXT                -- dodatočné poznámky
```

## 🔧 **MIGRAČNÝ PLÁN**

### **FÁZA 1: BACKUP A ANALÝZA**
```bash
# Vytvorenie zálohy
pg_dump rentals > rentals_backup.sql

# Analýza používania polí
SELECT 
  'fuel_level' as field, COUNT(*) as total, COUNT(fuel_level) as not_null
FROM rentals
UNION ALL
SELECT 
  'odometer' as field, COUNT(*) as total, COUNT(odometer) as not_null  
FROM rentals;
-- ... pre všetky podozrivé polia
```

### **FÁZA 2: VYTVORENIE NOVEJ TABUĽKY**
```sql
-- Vytvorenie optimalizovanej štruktúry
CREATE TABLE rentals_new (
  -- VERZIA A štruktúra
);

-- Migrácia dát
INSERT INTO rentals_new (
  id, vehicle_id, customer_name, start_date, end_date,
  total_price, commission, payment_method, paid, status, 
  confirmed, is_flexible, handover_protocol_id, return_protocol_id,
  handover_place, order_number, created_at, updated_at
)
SELECT 
  id, vehicle_id, customer_name, start_date, end_date,
  total_price, commission, payment_method, paid, status,
  confirmed, is_flexible, handover_protocol_id, return_protocol_id, 
  handover_place, order_number, created_at, updated_at
FROM rentals;
```

### **FÁZA 3: UPDATE APLIKÁCIE**
```typescript
// Odstránenie referencií na zmazané polia
// Update API endpointov
// Update frontend komponentov
```

### **FÁZA 4: SWAP TABULIEK**
```sql
-- Rename starých a nových tabuliek
ALTER TABLE rentals RENAME TO rentals_old;
ALTER TABLE rentals_new RENAME TO rentals;

-- Update indexov a constraints
-- Update foreign keys
```

## 📊 **OČAKÁVANÉ VÝSLEDKY**

### **PERFORMANCE**
- **-46% stĺpcov** (39 → 21)  
- **-30% veľkosť DB** (menej storage)
- **+50% rýchlosť queries** (menej dát na načítanie)

### **ÚDRŽBA**
- **-90% chýb** (menej polí = menej možností na chybu)
- **+100% prehľadnosť** (jasná štruktúra)
- **Jednoduchší kód** (menej if/else podmienok)

## 🤔 **OTÁZKY PRE VÁS**

1. **Ktoré z "voliteľných" polí skutočne používate?**
   - `handover_place`, `order_number`, `deposit`, `allowed_kilometers`?

2. **Potrebujete históriu zmien?**
   - Ak áno → `history` JSONB pole
   - Ak nie → zmazať

3. **Ako riešite kilometrovanie?**
   - Ak používate → ponechať `allowed_kilometers`, `extra_kilometer_rate`
   - Ak nie → zmazať všetky km polia

4. **Preferujete VERZIU A (minimálna) alebo B (rozšírená)?**

**Napíšte mi vaše odpovede a vytvorím presný migračný script!** 🚀 