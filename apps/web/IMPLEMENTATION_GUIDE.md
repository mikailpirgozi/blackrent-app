# BatchDocumentForm - Implementačná príručka

## ⚠️ DÔLEŽITÉ:
Súbor BatchDocumentForm.tsx je veľmi veľký (1100+ riadkov). Kvôli tomu budem vytvárať **menšie utility komponenty** a **helper súbory** namiesto úpravy jedného veľkého súboru.

---

## 🎯 STRATÉGIA:

### Variant A: Modulárna architektúra (ODPORÚČAM)
Rozdeliť BatchDocumentForm na menšie komponenty:
```
/insurances/
  BatchDocumentForm.tsx (main)
  batch-components/
    VehicleSelect.tsx
    InsurerManagement.tsx
    InsuranceSection.tsx
    ServiceBookSection.tsx
    FinesSection.tsx
    DocumentTypeSelector.tsx
```

### Variant B: Rozšírený UnifiedDocumentForm (RÝCHLEJŠIE)
Upraviť existujúci UnifiedDocumentForm.tsx aby podporoval:
- Service book fields
- Fines fields
- Leasing insurance logic

---

## 💡 MÔJ NÁVRH:

**Použiť Variant B - je rýchlejší a jednoduchší!**

Prečo?
1. UnifiedDocumentForm už má všetku logiku
2. Stačí pridať nové polia
3. Batch form používa UnifiedDocumentForm vo vnútri
4. Menej kódu = menej chýb

---

## 🚀 AKO TO SPRAVIŤ:

### KROK 1: Rozš

íriť UnifiedDocumentForm
Pridať podporu pre:
- Service book (serviceDate, serviceDescription, serviceKm, serviceProvider)
- Fines (všetky nové polia)
- Leasing (manual validTo)

### KROK 2: Update BatchDocumentForm
- Už máme: Vehicle Select s search ✅
- Pridať: Insurer Management dialógy
- Pridať: Conditional rendering pre service book / fines

### KROK 3: Backend mapping
VehicleCentricInsuranceList.tsx - upraviť handleBatchSave

---

## 📝 ČO CHCEŠ ABY SOM SPRAVIL?

**Možnosť 1:** Dokončím všetky úpravy v menších komponentoch (trvá dlhšie, ale cleanšie)

**Možnosť 2:** Rýchla implementácia v UnifiedDocumentForm + mini úpravy v Batch (rýchlejšie, funkčné)

**Možnosť 3:** Dám ti presný kód pre každú zmenu a ty ho aplikuješ manuálne

Ktorú možnosť preferuješ?

