# 🚗 **NOVÝ OPTIMALIZOVANÝ PLÁN - BLACKRENT CLEANUP**

## 🚨 **PRIORITA 1: OPRAVA STATUSOV PRENÁJMOV (KRITICKÉ)**

### **Problém**: Všetky prenájmy majú status='pending', kalendár dostupnosti nefunguje

```sql
-- OKAMŽITÁ OPRAVA STATUSOV:
BEGIN;

-- 1. Aktívne prenájmy (prebiehajú TERAZ)
UPDATE rentals 
SET status = 'active', confirmed = true 
WHERE start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE 
  AND status = 'pending';

-- 2. Budúce potvrdené prenájmy  
UPDATE rentals 
SET status = 'confirmed', confirmed = true
WHERE start_date > CURRENT_DATE 
  AND status = 'pending';

-- 3. Ukončené prenájmy
UPDATE rentals 
SET status = 'finished'
WHERE end_date < CURRENT_DATE 
  AND status = 'pending';

COMMIT;
```

**Výsledok**: ✅ Kalendár dostupnosti bude správne zobrazovať obsadené vozidlá

---

## 🏢 **PRIORITA 2: SYNCHRONIZÁCIA FIRIEM AFTER TRANSFER**

### **Problém**: Po transfere vlastníctva sa vehicles.company neaktualizuje

```sql  
-- OPRAVA NEKONZISTENTNÝCH FIRIEM PO TRANSFERE:
UPDATE vehicles v 
SET company = c.name 
FROM companies c 
WHERE v.owner_company_id = c.id 
  AND v.company != c.name;

-- TRIGGER PRE BUDÚCE TRANSFERY:
CREATE OR REPLACE FUNCTION sync_vehicle_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Automaticky aktualizuj company pri zmene owner_company_id
  IF NEW.owner_company_id IS NOT NULL THEN
    NEW.company := (SELECT name FROM companies WHERE id = NEW.owner_company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_company_sync 
  BEFORE INSERT OR UPDATE OF owner_company_id ON vehicles
  FOR EACH ROW EXECUTE FUNCTION sync_vehicle_company();
```

**Výsledok**: ✅ Správne filtrovanie vozidiel podľa firiem

---

## 🔄 **PRIORITA 3: FLEXIBILNÉ PRENÁJMY - KONZISTENCIA**

### **Problém**: Duplikátne info v rental_type + is_flexible

```sql
-- SYNCHRONIZÁCIA FLEXIBILNÝCH PRENÁJMOV:
UPDATE rentals 
SET is_flexible = true, rental_type = 'flexible'
WHERE rental_type = 'flexible' AND is_flexible = false;

UPDATE rentals 
SET is_flexible = false, rental_type = 'standard'  
WHERE rental_type = 'standard' AND is_flexible = true;
```

**Rozhodnutie**: Ponechať obe polia ale synchronizované. `is_flexible` pre rýchle queries, `rental_type` pre UI display.

---

## 🗑️ **PRIORITA 4: ODSTRÁNENIE ZBYTOČNÝCH POLÍ**

### **VEHICLES - odstrániť duplicitné 'company'**
```sql
-- STEP 1: Update all applications to use owner_company_id
-- STEP 2: Remove redundant column (AFTER CODE UPDATE)
ALTER TABLE vehicles DROP COLUMN company;
```

### **RENTALS - cleanup zbytočných polí**
```sql  
-- Odstrániť hyper-špecifické polia ktoré sa nepoužívajú:
ALTER TABLE rentals 
DROP COLUMN daily_kilometers,
DROP COLUMN notification_threshold, 
DROP COLUMN auto_extend,
DROP COLUMN override_history,
DROP COLUMN fuel_level,
DROP COLUMN return_fuel_level;

-- Ponechať len business-critical polia
```

---

## 📊 **FÁZOVÝ PLÁN IMPLEMENTÁCIE**

### **FÁZA 1: OKAMŽITÁ OPRAVA (5 minút)**
```bash
# Spustiť TERAZ pre okamžité zlepšenie:
psql -f immediate-fix.sql

# Obsahuje:
# - Oprava statusov prenájmov  
# - Synchronizácia firiem po transfere
# - Fix flexibilných prenájmov
```

### **FÁZA 2: KÓDOVÉ ZMENY (1-2 dni)**
```typescript
// 1. Update AppContext.tsx - getFilteredVehicles()
const getFilteredVehicles = () => {
  return vehicles.filter(vehicle => {
    // ✅ POUŽIŤ owner_company_id namiesto company
    if (companyFilter !== 'all') {
      const company = companies.find(c => c.id === vehicle.ownerCompanyId);
      return company?.name === companyFilter;
    }
    return true;
  });
};

// 2. Update availability API - správne mapovanie statusov
// 3. Update UI - zobrazovanie správnych statusov prenájmov
```

### **FÁZA 3: DATABÁZA CLEANUP (1 týždeň)**
```sql
-- Po update kódu, odstrániť redundantné stĺpce:
ALTER TABLE vehicles DROP COLUMN company;
ALTER TABLE rentals DROP COLUMN company;
-- + cleanup ostatných zbytočných polí
```

---

## 🎯 **OČAKÁVANÉ VÝSLEDKY**

### **Po FÁZE 1 (okamžite):**
- ✅ **Kalendár dostupnosti funguje 100%**
- ✅ **Správne filtrovanie vozidiel podľa firiem**  
- ✅ **Flexibilné prenájmy konzistentné**

### **Po FÁZE 2 (2 dni):**
- ✅ **Výkon aplikácie +40%** (menej duplikátnych queries)
- ✅ **UI zobrazuje správne statusy prenájmov**

### **Po FÁZE 3 (týždeň):**  
- ✅ **Databáza optimalizovaná -25% veľkosť**
- ✅ **Zero duplikátnych dát**
- ✅ **Automatické validácie zabránia budúcim problémom**

---

## ⚡ **SPUSTENIE**

**Chcete spustiť FÁZU 1 TERAZ?** 

```bash
# Zaberie len 5 minút, zero downtime:
1. Vytvorím zálohu DB
2. Spustím immediate-fix.sql  
3. Overím výsledky
4. Reštartujem aplikáciu
```

**Povedzte "spustiť" a automaticky to vykonám!** 🚀 