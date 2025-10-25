# 🕐 KOMPLETNÁ OPRAVA DÁTUMOV - FINAL SOLUTION

## 📋 Problém

Dátumy v poistk ách, STK/EK/Vignette, pokutách a servisnej knižke sa zobrazovali o 1 deň skoršie ako boli zadané.

**Príklad:**
- Zadané: 15.01.2025
- Zobrazené: 14.01.2025 ❌

## 🔍 Príčina

`JSON.stringify()` automaticky konvertuje `Date` objekty na ISO stringy s UTC timezone:

```javascript
const date = new Date(2025, 0, 15, 0, 0, 0); // 15.1.2025 00:00:00 (lokálny čas)
JSON.stringify({ date }); 
// → {"date":"2025-01-14T23:00:00.000Z"} ❌ (UTC, o 1 hodinu späť = 14.1.2025)
```

## ✅ Riešenie

### 1. Frontend - Formátovanie pred odoslaním

Vytvorené helper funkcie v React Query hooks ktoré formátujú dátumy pred odoslaním na API:

**`formatDateToString()`** - konvertuje Date na string bez timezone:
```javascript
formatDateToString(new Date(2025, 0, 15, 0, 0, 0))
// → "2025-01-15 00:00:00" ✅
```

**Upravené súbory:**
- ✅ `apps/web/src/lib/react-query/hooks/useInsurances.ts`
  - `formatInsuranceDates()` - formátuje `validFrom`, `validTo`, `greenCardValidFrom`, `greenCardValidTo`
  - Použité v `useCreateInsurance()` a `useUpdateInsurance()`

- ✅ `apps/web/src/lib/react-query/hooks/useVehicleDocuments.ts`
  - `formatVehicleDocumentDates()` - formátuje `validFrom`, `validTo`
  - Použité v `useCreateVehicleDocument()` a `useUpdateVehicleDocument()`

- ✅ `apps/web/src/hooks/useFines.ts`
  - `formatFineDates()` - formátuje `fineDate`, `ownerPaidDate`, `customerPaidDate`
  - Použité v create a update mutations

- ✅ `apps/web/src/hooks/useServiceRecords.ts`
  - `formatServiceRecordDates()` - formátuje `serviceDate`
  - Použité v create a update mutations

### 2. Frontend - Parsovanie pri zobrazení

**`parseDate()`** - parsuje string na Date bez timezone konverzie:
```javascript
parseDate("2025-01-15 00:00:00")
// → Date(2025, 0, 15, 0, 0, 0) ✅ (lokálny čas, BEZ UTC konverzie)
```

**Upravené súbory:**
- ✅ `apps/web/src/components/ui/MaskedDateInput.tsx`
  - Používa `parseDate()` namiesto `parseISO()` alebo `new Date()`

- ✅ `apps/web/src/components/insurances/VehicleCentricInsuranceList.tsx`
  - `getExpiryStatus()` - parsuje `validTo`
  - `handleEdit()` - parsuje `validFrom` a `validTo` pri načítaní do formulára
  - `DocumentListItem` - parsuje `validTo` pri zobrazení
  - Green Card display - parsuje `greenCardValidTo`
  - Stats calculation - parsuje `validTo` pre výpočet najbližšieho expirácie

### 3. Backend - Už opravené

Backend už mal správne `.split('T')[0]` pre extrakciu len dátumovej časti:

- ✅ `backend/src/routes/insurances.ts` - `greenCardValidFrom`, `greenCardValidTo`
- ✅ `backend/src/routes/vehicle-documents.ts` - `validFrom`, `validTo`
- ✅ `backend/src/routes/fines.ts` - `fineDate`, `ownerPaidDate`, `customerPaidDate`
- ✅ `backend/src/routes/service-records.ts` - `serviceDate`

## 🧪 Testovanie

### Test 1: Formátovanie funguje
```bash
node test-date-format-simple.js
```

**Výsledok:**
```
✅ formatDateToString: 2025-01-15 10:30:00
✅ parseDate: 15.1.2025
✅ Round-trip: 15.1.2025 → "2025-01-15 00:00:00" → 15.1.2025
✅ JSON.stringify s formatovaním: Dátum zostal rovnaký!
```

### Test 2: Manuálne testovanie v aplikácii

1. Otvor aplikáciu
2. Choď na vozidlo Audi A4
3. Pridaj novú poistku s dátumom **15.01.2025**
4. Ulož
5. Over že sa zobrazuje **15.01.2025** (nie 14.01.2025)

## 📊 Pokrytie

Všetky sekcie s dátumami sú opravené:

- ✅ **Poistky** (PZP, Havarijné, Green Card)
- ✅ **STK/EK/Vignette**
- ✅ **Pokuty**
- ✅ **Servisná knižka**

## 🎯 Kľúčové body

1. **Frontend mutations** - formátujú dátumy pred odoslaním cez `formatDateToString()`
2. **Frontend display** - parsujú dátumy cez `parseDate()` namiesto `parseISO()` alebo `new Date()`
3. **Backend** - už mal správne `.split('T')[0]`
4. **Žiadne UTC konverzie** - dátumy zostávajú fixné ako boli zadané

## ✅ Status

**KOMPLETNE OPRAVENÉ** - Všetky dátumy sa teraz zobrazujú presne ako boli zadané, bez posunov o 1 deň.

