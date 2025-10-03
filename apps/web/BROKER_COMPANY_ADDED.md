# ✅ Maklerská spoločnosť - PRIDANÉ!

## 🎯 Čo bolo spravené:

### 1. ✅ TypeScript Interface rozšírený
**Súbor:** `/src/types/index.ts`

```typescript
export interface Insurance {
  ...
  company: string;              // Poisťovňa
  insurerId?: string | null;    // ID poisťovne  
  brokerCompany?: string;        // 🆕 Maklerská spoločnosť
  paymentFrequency: PaymentFrequency;
  ...
}
```

### 2. ✅ BatchDocumentForm aktualizovaný
**Súbor:** `/src/components/insurances/BatchDocumentForm.tsx`

**Pridané:**
- `brokerCompany` do `DocumentFormData` interface
- Input pole "Maklerská spoločnosť" v insurance sekcii
- Grid layout zmenený na 4 stĺpce (Číslo, Poisťovňa, Makler, Frekvencia)

**Umiestnenie:**
```
Poistenie PZP (rozbalené)
├─ Číslo poistky *
├─ Poisťovňa *
├─ Maklerská spoločnosť    ← 🆕 NOVÉ POLE
└─ Frekvencia platenia *
```

### 3. ✅ UnifiedDocumentForm aktualizovaný
**Súbor:** `/src/components/common/UnifiedDocumentForm.tsx`

**Pridané:**
- `brokerCompany` do `UnifiedDocumentData` interface
- Inicializácia v `formData` state
- Persist pri edit mode

### 4. ✅ Backend handleBatchSave aktualizovaný
**Súbor:** `/src/components/insurances/VehicleCentricInsuranceList.tsx`

**Pridané:**
- `brokerCompany` do type definície
- `brokerCompany` do `insuranceData` objektu pri vytváraní poistky

```typescript
const insuranceData = {
  ...
  company: data.company || '',
  insurerId: selectedInsurer?.id || null,
  brokerCompany: data.brokerCompany || '', // 🆕
  paymentFrequency: data.paymentFrequency || 'yearly',
  ...
};
```

---

## 🎯 User Flow:

### Batch Creation (ADD mode):
```
1. Vyber vozidlo
2. Zaškrtni "Poistenie PZP"
3. Rozbaľ sekciu
4. Vyplň:
   - Číslo poistky: ABC123
   - Poisťovňa: Allianz
   - Maklerská spoločnosť: XY Broker s.r.o.  ← 🆕
   - Frekvencia: Ročne
5. Ulož
```

### Edit mode:
```
1. Klikni na existujúcu poistku
2. Vidíš pole "Maklerská spoločnosť"  
3. Môžeš upraviť/pridať makléra
4. Ulož zmeny
```

---

## 📝 Backend TODO:

**⚠️ DÔLEŽITÉ:** Backend API musí podporovať `brokerCompany` pole!

### Potrebné zmeny v backend:

#### 1. Databáza migrácia:
```sql
ALTER TABLE insurances 
ADD COLUMN broker_company VARCHAR(255);
```

#### 2. Backend model (Prisma schema):
```prisma
model Insurance {
  ...
  company         String
  insurerId       String?
  brokerCompany   String?  @map("broker_company")
  ...
}
```

#### 3. Backend DTO:
```typescript
interface CreateInsuranceDto {
  ...
  company: string;
  insurerId?: string;
  brokerCompany?: string; // 🆕
  ...
}
```

---

##  ✅ Frontend Status:
- ✅ TypeScript interface
- ✅ BatchDocumentForm UI
- ✅ UnifiedDocumentForm UI
- ✅ Backend mapping

## ⏳ Backend Status:
- ⏸️ Database migration (needs to be created)
- ⏸️ Prisma schema update
- ⏸️ API endpoint update

---

**Frontend je READY!** Backend needs update. 🚀

