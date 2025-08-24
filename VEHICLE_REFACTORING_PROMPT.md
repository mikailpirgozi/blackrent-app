# 🚀 REFAKTORING ÚLOHA: VehicleListNew.tsx

## 📋 ZADANIE
Potrebujem refaktorovať `src/components/vehicles/VehicleListNew.tsx` (3005 riadkov) na modulárne komponenty a custom hooks, podobne ako sme úspešne refaktorovali `RentalListNew.tsx`.

## 🎯 CIEĽ
Rozdeliť monolitický komponent na menšie, znovupoužiteľné časti bez straty funkcionality.

## ⚠️ KRITICKÉ POŽIADAVKY
- **ZACHOVAŤ VŠETKY 3005 RIADKOV KÓDU** - nič nesmie byť stratené
- **ŽIADNA FUNKCIONALITA NESMIE BYŤ STRATENÁ** - všetko musí fungovať identicky
- **Investor/Owner logika** musí zostať presne rovnaká
- **CSV import/export** musí fungovať rovnako
- **Všetky dialógy a formuláre** zachované
- **Postupovať VEĽMI POMALY** - krok za krokom s overením

## 🏗️ NAVRHOVANÁ ARCHITEKTÚRA

### 📁 HLAVNÝ KOMPONENT
```
src/components/vehicles/VehicleList.tsx (300-400 riadkov)
```
- Orchestrátor všetkých komponentov
- State management koordinácia
- Layout a routing logika

### 📁 KOMPONENTY (src/components/vehicles/components/)
1. **VehicleFilters.tsx** - Search a filtrovanie vozidiel
2. **VehicleTable.tsx** - Desktop tabuľka + Mobile card view
3. **VehicleActions.tsx** - Add/Edit/Delete tlačidlá
4. **OwnerCard.tsx** - Karta majiteľa s vozidlami
5. **InvestorCard.tsx** - Karta investora s ownership %
6. **VehicleImportExport.tsx** - CSV import/export logika
7. **VehicleStats.tsx** - Štatistiky vozidiel
8. **VehicleDialogs.tsx** - Všetky dialógy a formuláre

### 📁 CUSTOM HOOKS (src/hooks/)
1. **useVehicleFilters.ts** - Filter state management
2. **useVehicleActions.ts** - CRUD operations
3. **useOwnerManagement.ts** - Owner/Investor logika
4. **useVehicleImport.ts** - CSV parsing logika
5. **useVehicleStats.ts** - Statistics calculations

### 📁 UTILITIES (src/utils/)
1. **vehicleHelpers.ts** - Status helpers, formatting
2. **csvHelpers.ts** - CSV parsing utilities

### 📁 TYPES (src/types/)
1. **vehicle-types.ts** - Vehicle interfaces, Filter types

## 🔧 IMPLEMENTAČNÝ PLÁN

### FÁZA 1: PRÍPRAVA
1. Vytvoriť backup súbor `VehicleListNew.backup.tsx`
2. Analyzovať závislosti a importy
3. Vytvoriť `vehicle-types.ts` s type definitions
4. Spočítať riadky pre verifikáciu

### FÁZA 2: EXTRAKCIA KOMPONENTOV (postupne)
1. **OwnerCard** → `components/OwnerCard.tsx`
2. **InvestorCard** → `components/InvestorCard.tsx`
3. **CSV logika** → `components/VehicleImportExport.tsx`
4. **Filtre** → `components/VehicleFilters.tsx`
5. **Tabuľka** → `components/VehicleTable.tsx`
6. **Actions** → `components/VehicleActions.tsx`
7. **Stats** → `components/VehicleStats.tsx`
8. **Dialogs** → `components/VehicleDialogs.tsx`

### FÁZA 3: CUSTOM HOOKS
1. `useVehicleFilters.ts`
2. `useVehicleActions.ts`
3. `useOwnerManagement.ts`
4. `useVehicleImport.ts`
5. `useVehicleStats.ts`

### FÁZA 4: UTILITIES
1. `vehicleHelpers.ts`
2. `csvHelpers.ts`

### FÁZA 5: HLAVNÝ KOMPONENT
1. Vytvoriť nový `VehicleList.tsx`
2. Integrovať všetky komponenty a hooks
3. Testovanie funkcionality

### FÁZA 6: FINALIZÁCIA
1. Update `App.tsx` import
2. Vymazať starý súbor
3. Verifikácia že všetko funguje

## 📊 OČAKÁVANÉ VÝSLEDKY
- **VehicleList.tsx**: ~350 riadkov (hlavný orchestrátor)
- **8 komponentov**: ~200-400 riadkov každý
- **5 custom hooks**: ~100-300 riadkov každý
- **Utilities**: ~50-150 riadkov každý
- **Celkovo**: ~3005+ riadkov (všetko zachované + nové)

## 🚨 DÔLEŽITÉ PRAVIDLÁ
1. **Postupovať VEĽMI POMALY** - jeden komponent za čas
2. **Overiť funkcionalitu** po každom kroku
3. **Zachovať VŠETKY riadky kódu** - nič nevynechať
4. **Testovať build** po každej zmene
5. **Spýtať sa ak niečo nie je jasné** - radšej sa opýtať ako pokaziť

## 🎯 ZAČNI TÝMTO PRÍKAZOM
```
Začni refaktoringom VehicleListNew.tsx podľa tohto plánu. Postupuj VEĽMI POMALY, krok za krokom. Najprv vytvor backup a analyzuj súbor.
```

---
*Tento refaktoring je založený na úspešnom refaktoringu RentalListNew.tsx, kde sme rozdelili 5043 riadkov na modulárne komponenty bez straty funkcionality.*
