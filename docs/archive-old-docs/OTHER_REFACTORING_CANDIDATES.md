# 📊 ĎALŠIE KANDIDÁTI NA REFAKTORING

## 🎯 PRIORITIZOVANÉ SÚBORY PRE REFAKTORING

### 1. 🚗 **VehicleListNew.tsx** - **3005 riadkov** (NAJVYŠŠÍ KANDIDÁT)
- **Komplexnosť**: Veľmi vysoká
- **Komponenty**: OwnerCard, InvestorCard, CSV import/export
- **Odporúčanie**: ✅ **ZAČAŤ S TÝMTO** - podobný RentalListNew.tsx
- **Prompt**: Použiť `VEHICLE_REFACTORING_PROMPT.md`

### 2. 📈 **Statistics.tsx** - **2477 riadkov** (STREDNÝ KANDIDÁT)
- **Komplexnosť**: Vysoká
- **Komponenty**: Grafy, metriky, štatistiky
- **Rozdelenie**:
  - `StatisticsOverview.tsx` - základné metriky
  - `StatisticsCharts.tsx` - grafy a vizualizácie
  - `StatisticsFilters.tsx` - filtrovanie období
  - `useStatistics.ts` - výpočty a data processing
- **Poznámka**: Už má `StatisticsMobile.tsx` oddelene

### 3. 📧 **EmailManagementDashboard.tsx** - **2363 riadkov** (STREDNÝ KANDIDÁT)
- **Komplexnosť**: Stredná-Vysoká
- **Komponenty**: Email processing, IMAP management
- **Rozdelenie**:
  - `EmailList.tsx` - zoznam emailov
  - `EmailFilters.tsx` - filtrovanie
  - `EmailActions.tsx` - approve/reject actions
  - `ImapControls.tsx` - IMAP management
  - `useEmailManagement.ts` - API logika
- **Poznámka**: Špecializovaný admin nástroj

### 4. 🚗 **VehicleCentricInsuranceList.tsx** - **1764 riadkov** (NIŽŠÍ KANDIDÁT)
- **Komplexnosť**: Stredná
- **Rozdelenie**: Menšie, ale stále užitočné

### 5. 📝 **RentalForm.tsx** - **1699 riadkov** (NIŽŠÍ KANDIDÁT)
- **Komplexnosť**: Stredná
- **Poznámka**: Formulár - ťažšie rozdeliť bez straty UX

## 🎯 ODPORÚČANÉ PORADIE REFAKTORINGU

1. **VehicleListNew.tsx** (3005) - ✅ **ZAČAŤ S TÝMTO**
2. **Statistics.tsx** (2477) - Po dokončení vehicles
3. **EmailManagementDashboard.tsx** (2363) - Admin nástroj
4. Ostatné podľa potreby

## 🚨 PRAVIDLÁ PRE VŠETKY REFAKTORINGY

### ⚠️ KRITICKÉ POŽIADAVKY
- **ZACHOVAŤ VŠETKY RIADKY KÓDU** - nič nesmie byť stratené
- **ŽIADNA FUNKCIONALITA NESMIE BYŤ STRATENÁ**
- **Postupovať VEĽMI POMALY** - krok za krokom
- **Testovať po každom kroku**
- **Vytvoriť backup pred začatím**

### 🔧 ŠTANDARDNÝ POSTUP
1. **Backup** - vytvoriť `.backup.tsx`
2. **Analýza** - identifikovať komponenty a logiku
3. **Types** - vytvoriť type definitions
4. **Extrakcia** - postupne extrahovať komponenty
5. **Hooks** - vytvoriť custom hooks
6. **Utilities** - helper funkcie
7. **Integrácia** - nový hlavný komponent
8. **Testovanie** - overiť funkcionalitu
9. **Cleanup** - vymazať starý súbor

### 📊 OČAKÁVANÉ VÝSLEDKY
- **Hlavný komponent**: 300-500 riadkov
- **Podkomponenty**: 200-400 riadkov každý
- **Custom hooks**: 100-300 riadkov každý
- **Utilities**: 50-150 riadkov každý
- **Celkovo**: Zachované + nové riadky

## 🎯 PROMPT PRE NOVÝ CHAT

```
Chcem refaktorovať [NÁZOV_SÚBORU] ([POČET_RIADKOV] riadkov) na modulárne komponenty. 
Postupuj VEĽMI POMALY, zachovaj VŠETKY riadky kódu a VŠETKU funkcionalitu. 
Začni analýzou súboru a vytvorením detailného plánu rozdelenia.
```

---
*Založené na úspešnom refaktoringu RentalListNew.tsx (5043 → modulárne komponenty)*
