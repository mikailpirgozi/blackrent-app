# 🔄 **RIEŠENIE FLEXIBILNÝCH PRENÁJMOV - BLACKRENT**

## 🎯 **PROBLÉM**
Aktuálne máme duplicitné polia:
- `rental_type` ('standard' / 'flexible') 
- `is_flexible` (true/false)

Plus ďalšie flexibilné polia ktoré sa možno nepoužívajú:
- `flexible_end_date`, `can_be_overridden`, `override_priority`, `auto_extend`

## 💡 **NAVRHOVANÉ RIEŠENIE**

### **VARIANT 1: ZJEDNODUŠENIE (Odporúčané)**
```sql
-- Odstrániť všetky komplikované flexibilné polia
ALTER TABLE rentals 
DROP COLUMN flexible_end_date,
DROP COLUMN can_be_overridden, 
DROP COLUMN override_priority,
DROP COLUMN notification_threshold,
DROP COLUMN auto_extend,
DROP COLUMN override_history;

-- Ponechať len základné
-- is_flexible (boolean) - hlavné pole
-- rental_type - môže sa zmazať, alebo synchronizovať s is_flexible
```

**Logika:**
- `is_flexible = true` → prenájom je flexibilný (môže sa predĺžiť/skrátiť)
- `is_flexible = false` → štandardný prenájom s pevnými dátumami

### **VARIANT 2: SMART FLEXIBILNÉ (Ak chcete pokročilé funkcie)**
```sql
-- Ponechať len užitočné polia:
is_flexible (boolean) - základné označenie
flexible_settings (JSONB) - všetky nastavenia v jednom poli

-- Príklad flexible_settings:
{
  "can_extend": true,           -- môže sa predĺžiť
  "can_shorten": false,         -- nemôže sa skrátiť  
  "max_extension_days": 14,     -- max predĺženie o 14 dní
  "override_priority": 5,       -- priorita pri konflikte
  "notification_days": 3        -- upozorniť 3 dni pred koncom
}
```

## 🔧 **IMPLEMENTÁCIA**

### **KROK 1: Cleanup súčasných dát**
```sql
-- Synchronizácia súčasných nekonzistencií
UPDATE rentals 
SET is_flexible = true, rental_type = 'flexible'
WHERE rental_type = 'flexible' AND is_flexible = false;

UPDATE rentals 
SET is_flexible = false, rental_type = 'standard'  
WHERE rental_type = 'standard' AND is_flexible = true;
```

### **KROK 2: Zjednodušenie (VARIANT 1)**
```sql
-- Odstránenie zbytočných polí
ALTER TABLE rentals 
DROP COLUMN flexible_end_date,
DROP COLUMN can_be_overridden, 
DROP COLUMN override_priority,
DROP COLUMN notification_threshold,
DROP COLUMN auto_extend,
DROP COLUMN override_history,
DROP COLUMN rental_type;  -- duplikát is_flexible

-- Ponechanie len is_flexible (boolean)
```

### **KROK 3: Update aplikačnej logiky**
```typescript
// Frontend - jednoduchá logika
const isFlexibleRental = rental.is_flexible;

// Kalendár dostupnosti
const vehicleStatus = isFlexibleRental ? 'flexible' : 'rented';

// UI indikátor
{rental.is_flexible && (
  <Chip label="FLEXIBILNÝ" color="warning" size="small" />
)}
```

### **KROK 4: Availability API update**
```typescript
// backend/src/routes/availability.ts
const isFlexible = rental?.is_flexible;
const status = isFlexible ? 'flexible' : 'rented';

return {
  status,
  rentalId: rental.id,
  customerName: rental.customerName,
  isFlexible  // pre frontend info
}
```

## 🎯 **VÝHODY ZJEDNODUŠENIA**

✅ **Menej chýb** - jediné pole namiesto 6+ polí  
✅ **Rýchlejší výkon** - menej stĺpcov v queries  
✅ **Jednoduchší kód** - `rental.is_flexible` namiesto komplexnej logiky  
✅ **Lepšia údržba** - menej možností nekonzistencie  

## 📊 **MIGRAČNÝ PLÁN**

### **FÁZA 1: Synchronizácia (1 deň)**
```sql
-- Fix súčasných nekonzistencií
UPDATE rentals SET is_flexible = (rental_type = 'flexible');
```

### **FÁZA 2: Kód update (2 dni)**
```typescript  
// Všade nahradiť rental_type za is_flexible
// Odstrániť použitie komplikovaných flexibilných polí
```

### **FÁZA 3: DB cleanup (1 deň)**
```sql
-- Zmazať zbytočné stĺpce po update kódu
ALTER TABLE rentals DROP COLUMN rental_type, ...;
```

## 🤔 **OTÁZKA PRE VÁS**

**Ktorý variant preferujete?**

**VARIANT 1** - Jednoduché `is_flexible` boolean pole  
**VARIANT 2** - Pokročilé flexibilné nastavenia v JSONB

**Alebo máte iný nápad ako by flexibilné prenájmy mali fungovať?** 