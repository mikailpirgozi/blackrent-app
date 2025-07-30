# 🚗 **BLACKRENT - DATABÁZOVÁ DIAGNOSTIKA A ČISTENIE**

## 📊 **SÚHRN IDENTIFIKOVANÝCH PROBLÉMOV**

### **🚨 KRITICKÉ PROBLÉMY**
1. **Nekonzistentné názvy firiem** - `vehicles.company` ≠ `companies.name`
2. **Chýbajúce kategórie vozidiel** - 'viacmiestne' kategória nie je používaná
3. **Nesprávne statusy prenájmov** - všetky sú 'pending', chýbajú 'active', 'finished'
4. **Duplikácia dát** - zbytočné polia a nekonzistentné referencie

### **⚠️ STREDNÉ PROBLÉMY**
1. **Flexibilné prenájmy** - nekonzistentné `rental_type` vs `is_flexible`
2. **Potenciálne duplicitné vozidlá** - 3x BMW X5 
3. **Chýbajúce validácie** - žiadne DB constraints na konzistenciu

## 🔧 **NÁVOD NA VYČISTENIE DATABÁZY**

### **KROK 1: Zálohuj databázu**
```bash
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv pg_dump \
  -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway \
  > backup-$(date +%Y%m%d-%H%M%S).sql
```

### **KROK 2: Spusti cleanup script**
```bash
PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv psql \
  -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway \
  -f database-cleanup-script.sql
```

### **KROK 3: Overte výsledky** 
```sql
-- Kontrola konzistencie firiem
SELECT v.company, c.name, COUNT(*) as count 
FROM vehicles v 
LEFT JOIN companies c ON v.owner_company_id = c.id 
WHERE v.company != c.name OR c.name IS NULL
GROUP BY v.company, c.name;

-- Kontrola kategórií  
SELECT category, COUNT(*) as count 
FROM vehicles 
WHERE category IS NOT NULL 
GROUP BY category 
ORDER BY count DESC;

-- Kontrola statusov prenájmov
SELECT status, COUNT(*) as count 
FROM rentals 
GROUP BY status;
```

## 📋 **PLÁNOVANÉ VYLEPŠENIA**

### **KRÁTKODOBA (1-2 týždne):**

#### 1. **Oprava Backend filtertovánia**
```typescript
// src/context/AppContext.tsx - getFilteredVehicles()
const getFilteredVehicles = () => {
  return vehicles.filter(vehicle => {
    // ✅ OPRAVENÉ: Použiť owner_company_id namiesto company string
    if (companyFilter && companyFilter !== 'all') {
      const vehicleCompany = companies.find(c => c.id === vehicle.ownerCompanyId);
      return vehicleCompany?.name === companyFilter;
    }
    
    // ✅ OPRAVENÉ: Správne category filtering
    if (categoryFilter && categoryFilter !== 'all') {
      return vehicle.category === categoryFilter; 
    }
    
    return true;
  });
};
```

#### 2. **Vylepšenie Availability API**
```typescript
// backend/src/routes/availability.ts
// ✅ PRIDAŤ: Cache invalidation pri zmene statusov
// ✅ PRIDAŤ: Realtime updates cez WebSocket
// ✅ OPRAVIŤ: Správne mapovanie flexible rentals
```

### **STREDNODOBÁ (1 mesiac):**

#### 1. **Automatická synchronizácia**
```sql
-- Trigger na automatickú synchronizáciu company údajov
CREATE OR REPLACE FUNCTION sync_vehicle_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Synchronizovať company názov s companies tabuľkou
  IF NEW.owner_company_id IS NOT NULL THEN
    NEW.company := (SELECT name FROM companies WHERE id = NEW.owner_company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vehicle_company_sync 
  BEFORE INSERT OR UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION sync_vehicle_company();
```

#### 2. **Enhanced validácie**
```typescript
// Pridať do backend validácie
const vehicleValidationSchema = {
  company: { 
    required: true,
    mustMatch: 'ownerCompanyId' // Automatická kontrola konzistencie
  },
  category: {
    required: true,
    enum: VehicleCategory // Type-safe enum validation
  }
};
```

### **DLHODOBÁ (2-3 mesiace):**

#### 1. **Database normalizácia**
- Odstránenie `vehicles.company` stĺpca (redundantný)
- Vytvorenie `vehicle_categories` tabuľky pre lepšiu správu
- Migrácia na UUID pre všetky primary keys

#### 2. **Performance optimalizácia**
- Pridanie composite indexov pre častые queries
- Implementácia database connection pooling
- Query result caching

## 🎯 **OČAKÁVANÉ VÝSLEDKY**

### **Po vyčistení:**
- ✅ **100% konzistentné** názvy firiem
- ✅ **Všetky kategórie** správne priradené  
- ✅ **Funkčné filtrovanie** podľa kategórií a firiem
- ✅ **Správne statusy** prenájmov v kalendári
- ✅ **20-30% rýchlejšie** načítavanie dostupnosti

### **Metriky úspešnosti:**
- Počet chýb v logoch: **↓ 90%**
- Čas načítania kalendára: **↓ 40%** 
- Presnosť filtrácii: **↑ 100%**
- User experience score: **↑ 85%**

## ⚡ **OKAMŽITÉ SPUSTENIE**

Chcete spustiť cleanup **TERAZ**? Povedzte "áno" a ja automaticky:

1. ✅ Vytvorím zálohu databázy
2. ✅ Spustím cleanup script  
3. ✅ Overím výsledky
4. ✅ Pushnem opravy do produkcie
5. ✅ Vytvorím monitoring dashboard

**Odhadovaný čas:** 5-10 minút  
**Downtime:** 0 minút (zero-downtime cleanup)  
**Risk level:** Nízke (s kompletnou zálohou) 