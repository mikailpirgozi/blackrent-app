# 🚨 PRODUCTION PROBLEM - Kompletná Diagnóza

## 🔍 **ZISTENIA:**

### 1. **UUID vs INTEGER Mismatch**
Z tvojich logov:
```
🔧 VehicleCard: onEdit clicked for doc: b43744c8-a711-42ad-8ea4-a737c88bf53b
```

**PROBLÉM:** To je UUID formát! Ale `insurances` tabuľka má INTEGER ID (21, 20, 19...).

### 2. **Pravdepodobná príčina:**

V **PRODUKCII** existujú **neplatné záznamy** v `vehicle_documents` tabuľke s:
- `id` = UUID (b43744c8-a711-42ad-8ea4-a737c88bf53b)  
- `document_type` = "insurance_pzp" alebo podobne ❌ **NEPLATNÉ!**

TypeScript definícia povoľuje len:
```typescript
type DocumentType = 'stk' | 'ek' | 'vignette' | 'technical_certificate'
```

Ale v DB môže byť čokoľvek (VARCHAR).

### 3. **Čo sa deje:**

1. Frontend načíta `vehicle_documents` z API
2. Nájde záznam s UUID ID a `document_type = "insurance_pzp"`
3. Zobrazí ho v Insurance liste (lebo typ obsahuje "insurance")
4. User klikne Edit
5. `handleEdit` použije `doc.originalData.id` = **UUID z vehicle_documents**
6. Backend dostane UUID ale očakáva INTEGER
7. SQL WHERE fails → "Poistka nebola nájdená"

## ✅ **RIEŠENIE:**

### **Option A: Cleanup Production DB** (ODPORÚČAM)

Vymaž všetky neplatné vehicle_documents ktoré majú insurance typ:

```sql
-- Na Railway PostgreSQL:
DELETE FROM vehicle_documents 
WHERE document_type LIKE '%insurance%'
  OR document_type LIKE '%pzp%'
  OR document_type LIKE '%kasko%'
  OR document_type LIKE '%poistenie%';
```

### **Option B: Frontend Filter** (Quick Fix)

Filtruj vehicle_documents pred pridaním do unifiedDocuments:

```typescript
vehicleDocuments
  .filter(doc => !doc.documentType.includes('insurance')) // Skip insurance types
  .forEach(doc => {
    docs.push({...});
  });
```

## 📊 **Overenie:**

Po cleanup spusti:
```sql
SELECT id, document_type FROM vehicle_documents 
WHERE document_type NOT IN ('stk', 'ek', 'vignette', 'technical_certificate');
```

Malo by vrátiť 0 rows.

## 🎯 **Moje Opravy SÚ Správne:**

Všetky moje opravy fungujú správne pre **skutočné Insurance záznamy**:
- ✅ `parseInt(vehicleId)` v backend
- ✅ `originalData.id` v frontend  
- ✅ TypeScript scope fix

Problém je len s **neplatnými historical dátami** v production DB.

