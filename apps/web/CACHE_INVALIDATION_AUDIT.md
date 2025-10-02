# 🔍 BLACKRENT - CACHE INVALIDATION AUDIT

**Dátum:** 2. Október 2025  
**Problém:** Zmeny sa nezobrazujú hneď, treba refresh stránky

---

## 🚨 KRITICKÉ PROBLÉMY NÁJDENÉ:

### **1. InsuranceClaimList.tsx - NEDOKONČENÁ MIGRÁCIA** ⚠️ **KRITICKÉ**

**Lokácia:** `src/components/insurances/InsuranceClaimList.tsx` (riadky 102-117)

```typescript
// ❌ AKTUÁLNY STAV:
const createInsuranceClaim = async (claim: InsuranceClaim) => {
  // TODO: Implement createInsuranceClaim in React Query hooks
  console.warn('createInsuranceClaim not yet implemented...', claim);
};
const updateInsuranceClaim = async (claim: InsuranceClaim) => {
  // TODO: Implement updateInsuranceClaim in React Query hooks
  console.warn('updateInsuranceClaim not yet implemented...', claim);
};
```

**TOTO JE PRÁZDNA FUNKCIA!** Keď uložíte claim, **NIČ SA NESTANE**!

**Riešenie:**
```typescript
// ✅ OPRAVA:
const createClaimMutation = useCreateInsuranceClaim();
const updateClaimMutation = useUpdateInsuranceClaim();

const handleSave = async (claimData: InsuranceClaim) => {
  try {
    if (editingClaim?.id) {
      await updateClaimMutation.mutateAsync(claimData);
    } else {
      await createClaimMutation.mutateAsync(claimData);
    }
    setOpenDialog(false);
    setEditingClaim(null);
  } catch (error) {
    console.error('Chyba:', error);
  }
};
```

---

### **2. VŠEOBECNÝ PATTERN - ČO KONTROLOVAŤ:**

Vo **VŠETKÝCH sekciách** kde máte problém, skontrolujte:

#### **A) Používate mutation hooks?**
```typescript
// ❌ ZLE (prázdna funkcia):
const saveData = async (data) => {
  console.warn('not implemented');
};

// ✅ SPRÁVNE (mutation hook):
const mutation = useCreateInsurance();
const saveData = (data) => mutation.mutate(data);
```

#### **B) Volá sa invalidateQueries?**
```typescript
// V mutation hooku MUSÍ byť:
onSettled: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.insurances.all, // ✅ Správny kľúč!
  });
}
```

#### **C) Používate správny query key?**
```typescript
// ❌ ZLE:
const { data } = useQuery({
  queryKey: ['insurances'], // Generic key
});

// ✅ SPRÁVNE:
const { data } = useQuery({
  queryKey: queryKeys.insurances.lists(), // Specific factory
});
```

---

## 📋 AUDIT VŠETKÝCH SEKCIÍ:

### **1. INSURANCES** ⚠️ **PROBLÉM NÁJDENÝ**

**Súbory:**
- `InsuranceClaimList.tsx` - ❌ **PRÁZDNE FUNKCIE**
- `InsuranceForm.tsx` - ⚠️ Nepoužíva mutations direct
- `VehicleCentricInsuranceList.tsx` - ✅ Používa mutations

**Fix:** Implementovať createInsuranceClaim a updateInsuranceClaim

---

### **2. RENTALS** ✅ **PRAVDEPODOBNE OK**

```typescript
// useRentals.ts má:
- useCreateRental() ✅
- useUpdateRental() ✅  
- useDeleteRental() ✅
- Všetky majú invalidateQueries ✅
```

**ALE:** Skontroluj či komponenty ich používajú!

---

### **3. VEHICLES** ✅ **PRAVDEPODOBNE OK**

```typescript
// useVehicles.ts má:
- useCreateVehicle() ✅
- useUpdateVehicle() ✅
- useDeleteVehicle() ✅
- Invalidation setup ✅
```

---

### **4. CUSTOMERS** ❓ **TREBA SKONTROLOVAŤ**

Pozriem sa na CustomerList komponenty...

---

### **5. EXPENSES** ❓ **TREBA SKONTROLOVAŤ**

Pozriem sa na ExpenseList komponenty...

---

### **6. SETTLEMENTS** ❓ **TREBA SKONTROLOVAŤ**

Pozriem sa na SettlementList komponenty...

---

## 🔧 MOŽNÉ PRÍČINY (PRIORITY):

| Príčina | Pravdepodobnosť | Dopad | Priorita |
|---------|----------------|-------|----------|
| **1. Nedokončená migrácia (prázdne funkcie)** | 🔴 Vysoká | Kritický | **FIX HNEĎ** |
| **2. Chýbajúce invalidateQueries** | 🟡 Stredná | Vysoký | FIX HNEĎ |
| **3. Nesprávne query keys** | 🟡 Stredná | Vysoký | Kontrola |
| **4. WebSocket nefunguje** | 🟢 Nízka | Stredný | Nice-to-have |
| **5. Stale time príliš vysoký** | 🟢 Nízka | Nízky | Kontrola |

---

## 🎯 ODPORÚČANÝ POSTUP OPRAVY:

### **KROK 1: Fix InsuranceClaimList (15 min)** ⚠️ **URGENT**

```typescript
// V InsuranceClaimList.tsx - REPLACE:

// ❌ Odstrániť:
const createInsuranceClaim = async (claim: InsuranceClaim) => {
  console.warn('not yet implemented', claim);
};
const updateInsuranceClaim = async (claim: InsuranceClaim) => {
  console.warn('not yet implemented', claim);
};

// ✅ Pridať:
const createClaimMutation = useCreateInsuranceClaim();
const updateClaimMutation = useUpdateInsuranceClaim();

const handleSave = async (claimData: InsuranceClaim) => {
  try {
    if (editingClaim?.id) {
      await updateClaimMutation.mutateAsync(claimData);
    } else {
      await createClaimMutation.mutateAsync(claimData);
    }
    setOpenDialog(false);
    setEditingClaim(null);
  } catch (error) {
    console.error('Chyba:', error);
    alert('Chyba pri ukladaní: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
  }
};
```

---

### **KROK 2: Audit všetkých komponentov (30 min)**

Vytvor audit script:

```bash
#!/bin/bash
# scripts/audit-mutations.sh

echo "🔍 MUTATION AUDIT - Hľadám prázdne funkcie a TODO"
echo "=================================================="

# Hľadaj TODO komentáre v mutation funkciách
echo ""
echo "📋 TODO v mutation funkciách:"
grep -rn "TODO.*Implement.*create\|TODO.*Implement.*update\|TODO.*Implement.*delete" src/components/ --include="*.tsx"

echo ""
echo "📋 console.warn v mutation funkciách:"
grep -rn "console.warn.*not yet implemented\|console.warn.*not implemented" src/components/ --include="*.tsx"

echo ""
echo "📋 Komponenty ktoré nepoužívajú mutation hooks:"
echo "(Hľadám async funkcie ktoré by mali byť mutations)"

# Hľadaj pattern: const functionName = async () => { bez mutation
grep -rn "const.*= async.*=>" src/components/ --include="*.tsx" | grep -v "Mutation" | head -20
```

---

### **KROK 3: Globálny fix pattern (1 hod)**

Pre **KAŽDÝ** komponent kde je problém:

1. **Nájdi mutation hooks:**
   ```typescript
   // Musí byť na začiatku komponentu:
   const createMutation = useCreateXXX();
   const updateMutation = useUpdateXXX();
   const deleteMutation = useDeleteXXX();
   ```

2. **Použij mutations v handleSave:**
   ```typescript
   const handleSave = async (data) => {
     if (editMode) {
       await updateMutation.mutateAsync(data);
     } else {
       await createMutation.mutateAsync(data);
     }
     closeDialog();
   };
   ```

3. **Skontroluj invalidateQueries:**
   ```typescript
   // V mutation hook súbore (napr. useInsurances.ts):
   onSettled: () => {
     queryClient.invalidateQueries({
       queryKey: queryKeys.insurances.all,
     });
   }
   ```

---

## 🔬 DIAGNOSTIKA - AKO ZISTIŤ PRESNE KDE JE PROBLÉM:

### **Test v Chrome DevTools:**

1. Otvor Chrome DevTools (F12)
2. Prejdi na **Console**
3. Vykonaj akciu (upraviť poistku)
4. Hľadaj:

```javascript
// ❌ BAD SIGN:
"⚠️ not yet implemented in React Query hooks"
"console.warn: createInsuranceClaim not yet implemented"

// ✅ GOOD SIGN:
"🚀 CREATE INSURANCE: Sending to server"
"✅ CREATE INSURANCE: Success!"
"🔄 Invalidating queries"
```

5. Otvor **Network** tab
6. Filter: XHR
7. Vykonaj akciu
8. Skontroluj:
   - Pošle sa API request? (ak nie → prázdna funkcia!)
   - Dostanete response 200? (ak áno → problém je cache)

---

## 🎯 MÔJ ODPORÚČENÝ FIX PLÁN:

### **PRIORITY 1: Insurance Claims** (15 min)
- Fix `InsuranceClaimList.tsx`
- Implementovať useCreateInsuranceClaim a useUpdateInsuranceClaim
- **TOTO OPRAVÍ problém v poistkách!**

### **PRIORITY 2: Audit ostatných sekcií** (30 min)
- Customers
- Expenses
- Settlements
- Users
- Všade kde máte refresh problém

### **PRIORITY 3: Skontrolovať invalidation logic** (30 min)
- Prejsť všetky mutation hooks
- Overiť že používajú správne query keys
- Overiť že sa volá invalidateQueries

---

## ❓ OTÁZKA PRE VÁS:

**V ktorých PRESNE sekciách máte tento problém?**

Povedzte mi a vytvorím vám **presný fix** pre každú sekciu:
- [ ] Poistky (Insurances) - už viem kde je problém
- [ ] Poistné udalosti (Insurance Claims) - už viem kde je problém
- [ ] Prenájmy (Rentals)
- [ ] Vozidlá (Vehicles)
- [ ] Zákazníci (Customers)
- [ ] Výdavky (Expenses)
- [ ] Vyúčtovania (Settlements)
- [ ] Používatelia (Users)
- [ ] Iné?

**Zaškrtnite všetky kde je problém a ja to VŠETKO opravím!** 🔧

