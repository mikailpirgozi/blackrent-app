# 🗄️ CACHE DEPENDENCY MAP - MIGRATION PLAN

## 📊 AKTUÁLNE CACHE SYSTÉMY A ICH POUŽITIE

### **1. BACKEND CACHE SYSTÉMY**

#### **A) cache-middleware.ts** 
**Používa sa v:**
- `backend/src/routes/customers.ts:6` - `import { cacheResponse }`
- `backend/src/routes/companies.ts:6` - `import { cacheResponse }`  
- `backend/src/routes/vehicles.ts:6` - `import { cacheResponse }`

**Funkcie:**
- `cacheResponse()` - Express middleware pre API cache
- `invalidateCache()` - Cache invalidation
- `userSpecificCache()` - User-specific cache keys

**Riziko:** 🔴 **VYSOKÉ** - Používa sa v 3 hlavných API routes

#### **B) postgres-database.ts cache**
**Interné cache systémy:**
- `vehicleCache` - Cache pre vozidlá (TTL: 10 min)
- `permissionCache` - Cache pre permissions (TTL: 5 min)
- `calendarCache` - Cache pre kalendár (TTL: 5 min)
- `unavailabilityCache` - Cache pre nedostupnosť (TTL: 3 min)

**Riziko:** 🔴 **KRITICKÉ** - Hlboká integrácia v databázovej vrstve

### **2. FRONTEND CACHE SYSTÉMY**

#### **C) apiCache.ts**
**Používa sa v:**
- `src/services/api.ts` - Import ale **NEPOUŽÍVA SA AKTÍVNE**

**Riziko:** 🟢 **NÍZKE** - Minimal usage, môže sa bezpečne odstrániť

#### **D) unifiedCache.ts**
**Používa sa v:**
- `src/context/AppContext.tsx:8` - `import { cacheHelpers, smartInvalidation }`

**Funkcie:**
- `cacheHelpers` - Helper funkcie
- `smartInvalidation` - Smart cache invalidation

**Riziko:** 🟡 **STREDNÉ** - Používa sa v AppContext

#### **E) AppContext cache state**
**Cache stav:**
- `dataLoaded` - Boolean flags pre načítané dáta
- `lastLoadTime` - Timestamp posledného načítania

**Riziko:** 🔴 **VYSOKÉ** - Používa sa v celej aplikácii

### **3. MONITORING SYSTÉMY**

#### **F) CacheMonitoring.tsx**
**Používa sa v:**
- Admin panel pre monitoring cache stats
- `cacheDebug.getStats()` - Debug informácie

**Riziko:** 🟡 **STREDNÉ** - Admin funkcionalita

---

## 🎯 **MIGRATION STRATEGY - POSTUPNÉ KROKY**

### **FÁZA 1: PRÍPRAVA (HOTOVO ✅)**
- [x] Git backup branches
- [x] Safety check script
- [x] Dependency mapping

### **FÁZA 2: NÍZKE RIZIKO (1-2 dni)**
**Krok 1:** Odstrániť `apiCache.ts`
- Minimal impact
- Nie je aktívne používaný
- Bezpečné odstránenie

### **FÁZA 3: STREDNÉ RIZIKO (3-4 dni)**
**Krok 2:** Migrovať `unifiedCache.ts` → nový systém
- Zachovať `cacheHelpers` API
- Zachovať `smartInvalidation` API
- Postupne nahradiť implementáciu

**Krok 3:** Aktualizovať `CacheMonitoring.tsx`
- Pripojiť na nový cache systém
- Zachovať admin funkcionalitu

### **FÁZA 4: VYSOKÉ RIZIKO (1 týždeň)**
**Krok 4:** Migrovať `cache-middleware.ts`
- Vytvoriť wrapper pre `cacheResponse`
- Postupne nahradiť v routes
- Testovať každý route osobne

**Krok 5:** Migrovať `postgres-database.ts` cache
- Najrizikovejší krok
- Vytvoriť wrapper pre existujúce cache
- Postupne nahradiť implementáciu

**Krok 6:** Migrovať `AppContext` cache state
- Zachovať `dataLoaded` API
- Integrovať s novým cache systémom

---

## 🛡️ **SAFETY MEASURES**

### **PRE KAŽDÝ KROK:**
1. `git commit -m "BACKUP: Before step X"`
2. `./scripts/cache-migration-check.sh`
3. Implementovať zmenu
4. `./scripts/cache-migration-check.sh`
5. Manuálne testy
6. Ak zlyhá → `git reset --hard HEAD~1`

### **ROLLBACK POINTS:**
- Po každom kroku = commit
- Po každej fáze = tag
- Emergency = `git checkout cache-migration-backup`

---

## 📈 **EXPECTED BENEFITS**

### **Po migrácii:**
- ⚡ **50% menej** cache kódu
- 🔄 **Konzistentné** cache správanie
- 🛡️ **Jednoduchšie** debugovanie
- 📊 **Lepšie** performance monitoring
- 🧹 **Ľahšie** maintenance

### **Performance targets:**
- Cache hit rate: 60% → 80%
- Memory usage: -30%
- API response time: -20%
