# 🔍 Protocol Issues - Comprehensive Checklist

**Dátum:** 2025-10-13  
**Status:** 🔧 DIAGNOSTICS  
**Úloha:** Identifikovať všetky miesta kde môžu byť problémy s protokolmi

---

## ✅ **OPRAVENÉ (Handover Protocol)**

### 1. **Backend: createHandoverProtocol() - INSERT id**
**Súbor:** `backend/src/models/postgres-database.ts:7620`  
**Status:** ✅ FIXED

```typescript
// ✅ OPRAVENÉ
INSERT INTO handover_protocols (
  id, rental_id, location, ...  // id je na prvej pozícii
) VALUES (
  $1, $2, $3, ...  // $1 = protocolData.id
)
```

**Fix:** Pridané `id` pole do INSERT statement

---

## ✅ **UŽ BOLO SPRÁVNE (Return Protocol)**

### 2. **Backend: createReturnProtocol() - INSERT id**
**Súbor:** `backend/src/models/postgres-database.ts:7793`  
**Status:** ✅ OK

```typescript
// ✅ UŽ SPRÁVNE
INSERT INTO return_protocols (
  id, rental_id, handover_protocol_id, ...  // id je na prvej pozícii
) VALUES (
  $1, $2, $3, ...  // $1 = protocolData.id
)
```

**Poznámka:** Return protocol už mal `id` v INSERT, takže tento fix nebol potrebný

---

## 🔴 **MOŽNÉ PROBLÉMY - TREBA SKONTROLOVAŤ**

### 3. **Frontend: PDF URL duplicity**
**Súbor:** `apps/web/src/components/rentals/RentalList.tsx:775`  
**Status:** ✅ FIXED

```typescript
// ✅ OPRAVENÉ - Rozdelené dev/production
if (import.meta.env.DEV) {
  pdfUrl = `/api/protocols/${type}/${id}/pdf?token=${token}`;
} else {
  pdfUrl = `${apiUrl}/api/protocols/${type}/${id}/pdf?token=${token}`;
}
```

---

### 4. **Backend: Return Protocol Validácia**
**Možný problém:** Return protocol má 500 error aj po fixe

**Kontrolné body:**

#### A) **Chýbajúce required polia**
```sql
-- Return protocols requir ed fields:
rental_id UUID NOT NULL  -- ✅ Poskytnuté
handover_protocol_id UUID  -- ⚠️ NULLABLE, ale možno sa očakáva
```

**Test:**
```javascript
// Frontend log ukazuje:
"handoverProtocolId": "d6a01128-61e8-4561-b509-cdb9f4a3d60c"  // ✅ OK
```

#### B) **JSONB format errors**
```javascript
// Skontroluj že všetky JSONB polia sú správne:
vehicleImages: [...],  // ✅ Array
vehicleVideos: [...],  // ✅ Array
documentImages: [...], // ✅ Array
damageImages: [...],   // ✅ Array
damages: [...],        // ✅ Array
signatures: [...]      // ✅ Array
```

#### C) **Decimal precision errors**
```sql
-- Decimal fields môžu zlyhať ak dostanú nesprávny formát:
kilometer_fee DECIMAL(10,2)      -- Očakáva napr. 15.50
fuel_fee DECIMAL(10,2)           -- Očakáva napr. 20.00
total_extra_fees DECIMAL(10,2)   -- Očakáva napr. 35.50
```

**Frontend log ukazuje:**
```javascript
// Tieto polia chýbajú v requeste! ⚠️
"kilometers_used": undefined,
"kilometer_overage": undefined,
"kilometer_fee": undefined,
"fuel_used": undefined,
"fuel_fee": undefined,
"total_extra_fees": undefined
```

**Možné riešenie:** Backend INSERT možno očakáva tieto polia, ale frontend ich neposiela.

---

### 5. **Backend Route: Return Protocol Handler**
**Súbor:** `backend/src/fastify/routes/protocols.ts:383-450`  
**Status:** 🔍 NEEDS INSPECTION

**Kontrolné body:**

```typescript
// A) Validácia vstupných dát
const protocolData = request.body;  // ✅ OK

// B) ID mapping
id: protocolData.id,  // ✅ OK

// C) Vehicle condition handling
vehicleCondition: protocolData.vehicleCondition || {
  odometer: 0,
  fuelLevel: 0,
  fuelType: 'gasoline' as const,
  exteriorCondition: '',
  interiorCondition: ''
}  // ⚠️ Možno fallback spôsobuje problém?

// D) Decimal fields
// ⚠️ CHÝBAJÚ v route handleri!
kilometersUsed: protocolData.kilometersUsed,
kilometerOverage: protocolData.kilometerOverage,
kilometerFee: protocolData.kilometerFee,
// ... atď
```

---

### 6. **Database Constraints**
**Kontrolné body:**

```sql
-- A) UUID format
id UUID PRIMARY KEY  -- ✅ Frontend generuje UUID v4

-- B) Foreign keys
rental_id UUID NOT NULL  -- ✅ Existujúci rental
handover_protocol_id UUID  -- ✅ Existujúci handover protocol

-- C) CHECK constraints
-- Skontroluj či neexistujú custom CHECK constraints ktoré zlyhajú
```

---

### 7. **TypeScript Type Mismatches**
**Možné problémy:**

```typescript
// A) Vehicle condition type
vehicleCondition: protocolData.vehicleCondition as unknown as Record<string, unknown>
// ⚠️ Type assertion môže skryť chyby

// B) Array types
vehicleImages: protocolData.vehicleImages || []
// ⚠️ Ak frontend posiela nesprávny formát, DB reject

// C) Nested objects
rental: { vehicle: { ... } }
// ⚠️ Deep nesting môže spôsobiť serialization errors
```

---

## 🔧 **DEBUGGING STEPS**

### Krok 1: Zapni detailné backend logy
```typescript
// backend/src/fastify/routes/protocols.ts:391
fastify.log.info({ 
  msg: '🔍 Return protocol data FULL DEBUG',
  protocolData: JSON.stringify(protocolData, null, 2)
});
```

### Krok 2: Skontroluj PostgreSQL error
```typescript
// backend/src/models/postgres-database.ts:7792
try {
  const result = await client.query(...);
} catch (error) {
  logger.migration('🔴 PostgreSQL ERROR:', error);
  logger.migration('🔍 Query params:', JSON.stringify([
    protocolData.id,
    protocolData.rentalId,
    // ... všetky parametre
  ]));
  throw error;
}
```

### Krok 3: Test priamo v PostgreSQL
```sql
-- Skús INSERT manuálne s rovnakými dátami
INSERT INTO return_protocols (
  id, rental_id, handover_protocol_id, ...
) VALUES (
  'd29e9cf5-f8b8-41e6-bbbc-1d825ea9d2b0',  -- Frontend UUID
  '769',  -- Rental ID
  'd6a01128-61e8-4561-b509-cdb9f4a3d60c',  -- Handover ID
  -- ... ostatné polia
);

-- Ak zlyhá, uvidíme presnú chybu
```

---

## 📊 **PRIORITY CHECKLIST**

### HIGH PRIORITY (Most Likely Issues)
- [ ] **Missing required fields** v Return protocol route
- [ ] **Decimal field validation** - kilometer_fee, fuel_fee
- [ ] **JSONB serialization** errors
- [ ] **Foreign key constraint** - handover_protocol_id existence

### MEDIUM PRIORITY
- [ ] Type mismatches v TypeScript
- [ ] Nested object serialization
- [ ] CHECK constraints violations

### LOW PRIORITY  
- [ ] PDF generation timing issues
- [ ] R2 upload failures (ale PDF sa generuje po DB insert)

---

## 🎯 **RECOMMENDED FIX ORDER**

1. ✅ **Handover protocol INSERT** - FIXED
2. ✅ **PDF URL duplicity** - FIXED
3. 🔧 **Return protocol missing fields** - ADD decimal fields to route
4. 🔧 **Backend logging** - ADD detailed error logging
5. 🧪 **Manual PostgreSQL test** - Verify constraints
6. 📊 **Type validation** - Improve TypeScript types

---

## 🚀 **NEXT ACTIONS**

### Immediate (Do Now)
```bash
# 1. Check Railway logs po deploye
railway logs --tail

# 2. Test handover protocol (should work now)
# Frontend → Create handover → Check success

# 3. Test return protocol with detailed logs
# Frontend → Create return → Check backend logs
```

### Short Term (After Deploy)
```typescript
// 1. Add missing fields to Return protocol route
kilometersUsed: protocolData.kilometersUsed || 0,
kilometerOverage: protocolData.kilometerOverage || 0,
kilometerFee: protocolData.kilometerFee || 0,
fuelUsed: protocolData.fuelUsed || 0,
fuelFee: protocolData.fuelFee || 0,
totalExtraFees: protocolData.totalExtraFees || 0,
depositRefund: protocolData.depositRefund || 0,
additionalCharges: protocolData.additionalCharges || 0,
finalRefund: protocolData.finalRefund || 0

// 2. Add comprehensive error logging
catch (error) {
  fastify.log.error({
    msg: '🔴 Return protocol creation failed',
    error: error.message,
    stack: error.stack,
    protocolId: protocolData.id,
    rentalId: protocolData.rentalId
  });
  throw error;
}
```

---

**Status:** 🔍 ACTIVE DIAGNOSTICS  
**Last Updated:** 2025-10-13 15:50  
**Next Review:** Po Railway deploy

