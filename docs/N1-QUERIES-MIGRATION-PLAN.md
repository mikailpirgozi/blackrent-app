# 🔴 N+1 QUERIES MIGRATION PLAN

## 📋 OVERVIEW
Optimalizácia databázových dotazov z N+1 pattern na efektívne JOIN queries.

## 🎯 CIELE
- **Performance:** 10-20x rýchlejšie načítanie dát
- **Databáza:** 99% redukcia počtu dotazov
- **UX:** Okamžité načítanie stránok

## 📊 AKTUÁLNY STAV (BASELINE)
- **Vehicles:** ~112 dotazov (1 + 111 companies)
- **Rentals:** ~500+ dotazov (1 + N vehicles + N companies)
- **Načítanie:** 3-5 sekúnd

## 🚀 CIEĽOVÝ STAV
- **Vehicles:** 1 JOIN dotaz
- **Rentals:** 1 JOIN dotaz
- **Načítanie:** 200-500ms

## 📋 MIGRATION STEPS

### FÁZA 1: VEHICLES OPTIMIZATION 🚗
**Súbor:** `backend/src/models/postgres-database.ts`
**Metóda:** `getVehicles()`, `getVehiclesFresh()`

**PRED:**
```sql
SELECT * FROM vehicles;  -- 1 dotaz
-- Pre každé vozidlo:
SELECT * FROM companies WHERE id = vehicle.company_id;  -- 111x dotazov
```

**PO:**
```sql
SELECT 
  v.*, 
  c.name as company_name,
  c.id as company_id
FROM vehicles v 
LEFT JOIN companies c ON v.company_id = c.id;  -- 1 dotaz!
```

### FÁZA 2: RENTALS OPTIMIZATION 🏠
**Súbor:** `backend/src/models/postgres-database.ts`
**Metóda:** `getRentals()`, `getRentalsPaginated()`

**PRED:**
```sql
SELECT * FROM rentals;  -- 1 dotaz
-- Pre každý rental:
SELECT * FROM vehicles WHERE id = rental.vehicle_id;  -- Nx dotazov
SELECT * FROM companies WHERE id = vehicle.company_id;  -- Nx dotazov
```

**PO:**
```sql
SELECT 
  r.*, 
  v.brand, v.model, v.license_plate,
  c.name as company_name
FROM rentals r 
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN companies c ON v.company_id = c.id;  -- 1 dotaz!
```

### FÁZA 3: PERFORMANCE VERIFICATION ⚡
- Zmeriať performance pred/po
- Overiť identické dáta
- Load testing s veľkým množstvom dát

## 🛡️ SAFETY MEASURES

### BACKUP STRATEGY
- **Git commit** pred každou zmenou
- **Database backup** pred začatím
- **Rollback script** pripravený

### TESTING STRATEGY
- **Automated checks** po každom kroku
- **Performance monitoring** pred/po
- **Data integrity** verification

### ROLLBACK PLAN
```bash
# Ak niečo zlyhá:
git checkout HEAD~1  # Vráť posledný commit
npm run dev:restart   # Reštartuj aplikáciu
```

## 📊 SUCCESS METRICS

### PERFORMANCE TARGETS
- **Vehicles API:** < 300ms (z 3000ms+)
- **Rentals API:** < 500ms (z 5000ms+)
- **Database queries:** < 5 (z 500+)

### QUALITY TARGETS
- **Zero data loss:** Všetky dáta identické
- **Zero downtime:** Aplikácia funguje počas migrácie
- **Zero errors:** Žiadne TypeScript/runtime chyby

## 🔧 TOOLS & SCRIPTS
- **Safety check:** `scripts/n1-queries-migration-check.sh`
- **Performance monitor:** Built-in timing
- **Data verification:** Automated comparison

## 📅 TIMELINE
- **Fáza 1:** 30-45 minút (Vehicles)
- **Fáza 2:** 45-60 minút (Rentals)
- **Fáza 3:** 15-30 minút (Testing)
- **Total:** ~2 hodiny

## ⚠️ RISK ASSESSMENT
- **Risk Level:** 🟡 STREDNÉ
- **Impact:** 🔴 VYSOKÝ (pozitívny)
- **Rollback:** ✅ JEDNODUCHÉ

---

**Status:** 🚀 READY TO START
**Next:** Spustiť safety check a začať s Fáza 1
