# 🌍 Implementácia krajín pre dialničné známky

## ✅ DOKONČENÉ - 3. Október 2025

### 🎯 Cieľ
Pridať podporu pre **výber krajiny** a **označenie povinnosti** pre dialničné známky v BlackRent aplikácii.

---

## 📋 ČO BOLO IMPLEMENTOVANÉ

### 1️⃣ **TypeScript Typy**
**Súbor:** `src/types/index.ts`

✅ Pridaný nový typ:
```typescript
export type VignetteCountry = 'SK' | 'CZ' | 'AT' | 'HU' | 'SI';
```

✅ Rozšírený `VehicleDocument` interface:
```typescript
export interface VehicleDocument {
  // ... existing fields
  country?: VignetteCountry; // 🌍 Krajina pre dialničné známky
  isRequired?: boolean; // ⚠️ Povinná/dobrovoľná dialničná známka
}
```

---

### 2️⃣ **Frontend Formulár**
**Súbor:** `src/components/common/UnifiedDocumentForm.tsx`

✅ **Nové polia v UI:**
- **Dropdown "Krajina dialničnej známky"** s flag emoji:
  - 🇸🇰 Slovensko
  - 🇨🇿 Česko
  - 🇦🇹 Rakúsko
  - 🇭🇺 Maďarsko
  - 🇸🇮 Slovinsko
  
- **Checkbox "Povinná dialničná známka"**
  - Zobrazuje sa len pri type === 'vignette'
  - Feedback text: "⚠️ Táto dialničná známka je označená ako povinná" / "✓ Táto dialničná známka je dobrovoľná"

✅ **Validácia:**
- Krajina je **povinná** pri vytváraní dialničnej známky
- Zobrazí chybu ak užívateľ neuvedie krajinu

✅ **Rozšírený UnifiedDocumentData interface:**
```typescript
export interface UnifiedDocumentData {
  // ... existing fields
  country?: VignetteCountry | undefined;
  isRequired?: boolean | undefined;
}
```

---

### 3️⃣ **Zobrazenie v Tabuľke**
**Súbor:** `src/components/insurances/VehicleCentricInsuranceList.tsx`

✅ **Vizuálne zobrazenie krajiny:**
- Flag emoji sa zobrazuje vedľa názvu "Dialničná známka"
- Príklad: "Dialničná známka 🇸🇰"

✅ **Badge pre povinnosť:**
- Ak `isRequired === true`: zobrazí sa "⚠️ Povinná"
- Ak `isRequired === false`: nezobrazí sa nič (dobrovoľná)

✅ **Rozšírený UnifiedDocument interface:**
```typescript
interface UnifiedDocument {
  // ... existing fields
  country?: string | undefined;
  isRequired?: boolean | undefined;
}
```

---

### 4️⃣ **API Integrácia**
**Súbor:** `src/components/vehicles/VehicleForm.tsx`

✅ **Ukladanie dokumentov:**
```typescript
const vehicleDocData: VehicleDocument = {
  // ... existing fields
  ...(data.country && { country: data.country }),
  ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
};
```

**Poznámka:** API `createVehicleDocument` a `updateVehicleDocument` už automaticky pošlú tieto polia na backend (žiadna zmena potrebná v `api.ts`).

---

### 5️⃣ **Helper Utilities**
**Súbor:** `src/utils/vignetteHelpers.ts` ✨ (NOVÝ)

✅ Vytvorené utility funkcie:
```typescript
getCountryFlag(country: VignetteCountry): string  // Vráti 🇸🇰
getCountryName(country: VignetteCountry): string  // Vráti "Slovensko"
getCountryDisplay(country: VignetteCountry): string  // Vráti "🇸🇰 Slovensko"
```

---

## 🗄️ DATABÁZOVÁ ZMENA (POTREBNÉ)

### ⚠️ **Backend migrácia**
**Musíš pridať do PostgreSQL `vehicle_documents` tabuľky:**

```sql
ALTER TABLE vehicle_documents
ADD COLUMN country VARCHAR(2),
ADD COLUMN is_required BOOLEAN DEFAULT false;
```

**Poznámky:**
- `country` je nullable (staré záznamy nemajú krajinu)
- `is_required` má default `false` (backward compatible)

---

## 📊 USE CASES

### ✅ **Príklad 1: Povinná slovenská dialničná známka**
```
Vozidlo: BMW 3 Series (EV-123AA)
Dialničná známka 🇸🇰
⚠️ Povinná
Platné do: 31.12.2025
Cena: 50€
```

### ✅ **Príklad 2: Dobrovoľná rakúska dialničná známka**
```
Vozidlo: Audi A4 (BA-456BB)
Dialničná známka 🇦🇹
Platné do: 31.08.2025
Cena: 95€
```

### ✅ **Príklad 3: Viacero dialničných známok pre jedno auto**
```
Auto má 3 samostatné záznamy:
1. Dialničná známka 🇸🇰 - ⚠️ Povinná - do 31.12.2025
2. Dialničná známka 🇨🇿 - ⚠️ Povinná - do 31.01.2026
3. Dialničná známka 🇦🇹 - Dobrovoľná - do 15.09.2025
```

---

## ✅ TESTOVANIE

### **Frontend Build**
```bash
npm run build
```
**Výsledok:** ✅ Build prešiel úspešne bez chýb

### **TypeScript Validation**
**Výsledok:** ✅ 0 errors, 0 warnings

---

## 🚀 ČO ĎALEJ

### 1️⃣ **Backend úprava (MUSÍŠ SPRAVIŤ)**
- [ ] Pridať DB migráciu (`country`, `is_required` stĺpce)
- [ ] Akceptovať nové polia v API endpoints `/vehicle-documents`

### 2️⃣ **Testovanie**
- [ ] Vytvoriť dialničnú známku SK - povinnú
- [ ] Vytvoriť dialničnú známku CZ - povinnú
- [ ] Vytvoriť dialničnú známku AT - dobrovoľnú
- [ ] Overiť že sa zobrazujú správne flag emoji a badge
- [ ] Overiť že validácia funguje (nemôžeš uložiť bez krajiny)

### 3️⃣ **Možné rozšírenia (voliteľné)**
- [ ] Filter podľa krajiny v tabuľke
- [ ] Export dialničných známok do CSV/Excel
- [ ] Notifikácie pri expirácii podľa krajiny

---

## 📝 ZMENY SUMMARY

| Súbor | Zmeny |
|-------|-------|
| `src/types/index.ts` | + VignetteCountry type, + country/isRequired do VehicleDocument |
| `src/components/common/UnifiedDocumentForm.tsx` | + Dropdown krajina, + Checkbox povinná, + Validácia |
| `src/components/insurances/VehicleCentricInsuranceList.tsx` | + Flag emoji, + Badge povinná |
| `src/components/vehicles/VehicleForm.tsx` | + Ukladanie country/isRequired |
| `src/utils/vignetteHelpers.ts` | ✨ NOVÝ - Helper funkcie pre flag emoji |

---

## 🎉 VÝSLEDOK

Teraz môžeš:
✅ Vytvárať dialničné známky pre **5 krajín** (SK, CZ, AT, HU, SI)  
✅ Označiť každú známku ako **povinnú** alebo **dobrovoľnú**  
✅ Mať **neobmedzenú históriu** všetkých dialničných známok per auto  
✅ Vidieť **flag emoji** a **badge povinná** v tabuľke  
✅ **Validácia** zabezpečuje že krajina je povinná  

---

**Implementované:** 3. Október 2025  
**Status:** ✅ FRONTEND HOTOVÝ | ⚠️ BACKEND MIGRÁCIA POTREBNÁ

