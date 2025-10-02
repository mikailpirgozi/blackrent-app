# 🔧 CACHE INVALIDATION - KOMPLETNÝ FIX PLÁN

**Dátum:** 2. Október 2025  
**Problém:** Zmeny sa nezobrazujú bez refresh  
**Príčina:** Nedokončená migrácia na React Query mutations  
**Odhadovaný čas:** 2-3 hodiny

---

## 🚨 NÁJDENÉ PROBLÉMY - 8 SÚBOROV:

### **KRITICKÉ (prázdne mutation funkcie):**

1. ❌ `InsuranceClaimList.tsx` - createInsuranceClaim, updateInsuranceClaim
2. ❌ `InsuranceForm.tsx` - používa onSave callback namiesto mutations
3. ❌ `VehicleForm.tsx` - createCompany not implemented
4. ❌ `ExpenseForm.tsx` - createCompany not implemented  
5. ❌ `RentalForm.tsx` - loadData, dispatch not implemented
6. ❌ `ExpenseListNew.tsx` - async funkcie
7. ❌ `SettlementListNew.tsx` - async funkcie
8. ❌ `CustomerListNew.tsx` - async funkcie

---

## 🎯 FIX STRATÉGIA:

### **PATTERN 1: Prázdne funkcie → React Query mutations**
```typescript
// ❌ PRED:
const createItem = async (item) => {
  console.warn('not implemented');
};

// ✅ PO:
const createMutation = useCreateItem();
const createItem = (item) => createMutation.mutate(item);
```

### **PATTERN 2: onSave callback → Direct mutation**
```typescript
// ❌ PRED:
<Form onSave={(data) => onSave(data)} />
// onSave sa zavolá ale cache sa neaktualizuje

// ✅ PO:
const mutation = useCreateItem();
<Form onSave={(data) => mutation.mutate(data)} />
```

### **PATTERN 3: Zabezpečiť invalidateQueries**
```typescript
// Každá mutation MUSÍ mať:
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.xxx.all });
}
```

---

## 📋 FIX CHECKLIST - PO SEKCIÁCH:

### **1. INSURANCE CLAIMS** ⚠️ Priority 1
- [ ] Fix InsuranceClaimList.tsx
- [ ] Implementovať useCreateInsuranceClaim
- [ ] Implementovať useUpdateInsuranceClaim
- [ ] Testovať create/update/delete

### **2. INSURANCES** ⚠️ Priority 1  
- [ ] Fix InsuranceForm.tsx
- [ ] Použiť mutations namiesto callbacks
- [ ] Testovať

### **3. VEHICLES** ⚠️ Priority 2
- [ ] Fix VehicleForm.tsx (createCompany)
- [ ] Testovať

### **4. EXPENSES** ⚠️ Priority 2
- [ ] Fix ExpenseForm.tsx (createCompany)
- [ ] Fix ExpenseListNew.tsx
- [ ] Testovať

### **5. RENTALS** ⚠️ Priority 2
- [ ] Fix RentalForm.tsx
- [ ] Testovať

### **6. SETTLEMENTS** ⚠️ Priority 3
- [ ] Fix SettlementListNew.tsx
- [ ] Testovať

### **7. CUSTOMERS** ⚠️ Priority 3
- [ ] Fix CustomerListNew.tsx
- [ ] Testovať

---

## 🚀 ZAČÍNAM S IMPLEMENTÁCIOU

Opravím všetko systematicky, sekciu po sekcii.
Začnem s najprioritnejšími (Insurance Claims a Insurances).

**Odhadovaný čas:** 2-3 hodiny  
**Výsledok:** Real-time updates fungujú všade ✅

