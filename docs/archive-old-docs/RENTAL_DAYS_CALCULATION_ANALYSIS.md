# 🔍 KOMPLETNÁ ANALÝZA: PROBLÉM VÝPOČTU DNÍ PRENÁJMU

## 📋 SÚHRN PROBLÉMU

**Aktuálny stav:** Systém má **nekonzistentný výpočet dní prenájmu** medzi rôznymi časťami aplikácie.

**Konkrétny príklad:**
- **Email parsing:** 8.9 od 08:00 do 10.9 do 17:00 = **3 dni** ✅ SPRÁVNE
- **Manuálne pridávanie:** 8.9 od 08:00 do 10.9 do 17:00 = **2 dni** ❌ NESPRÁVNE

**Požadovaná logika:**
- Ak prenájom končí v **rovnaký čas alebo skôr** ako začal = počíta sa ako predchádzajúci deň
- Ak prenájom končí **neskôr** ako začal = počíta sa ako ďalší deň
- **Príklad:** 10:00 do 10:00 = 2 dni, ale 10:00 do 10:01 = 3 dni

---

## 🎯 IDENTIFIKOVANÉ MIESTA V KÓDE

### 1. **FRONTEND - Rôzne implementácie**

#### A) `src/components/rentals/RentalForm.tsx` (PROBLEMATICKÉ)
```typescript
const calculateRentalDays = (startDate: Date, endDate: Date): number => {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return Math.max(1, daysDiff);
};
```
**Problém:** Používa `Math.ceil()` bez ohľadu na čas - nesprávne počíta dni.

#### B) `src/components/customers/CustomerRentalHistory.tsx` (INÁ LOGIKA)
```typescript
const calculateRentalDays = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};
```
**Problém:** Pridává `+ 1` - úplne iná logika ako ostatné miesta.

#### C) `src/components/Statistics.tsx` (ĎALŠIA INÁ LOGIKA)
```typescript
const rentalDays = differenceInDays(new Date(rental.endDate), new Date(rental.startDate)) + 1;
```
**Problém:** Používa `differenceInDays` + 1 - opäť iná implementácia.

### 2. **BACKEND - Tiež nekonzistentné**

#### A) `backend/src/routes/email-management.ts` (FUNGUJE SPRÁVNE)
```typescript
const rentalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
```
**Poznámka:** Toto je jediné miesto ktoré funguje správne pre email parsing.

#### B) `backend/src/routes/availability.ts` (INÁ LOGIKA)
```typescript
dayCount: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
```
**Problém:** Opäť pridáva `+ 1`.

---

## 🚨 KRITICKÉ DOPADY

### 1. **Finančné dopady**
- **Nesprávne ceny:** Zákazníci platia za iný počet dní ako skutočne majú
- **Nekonzistentné faktúry:** Email vs manuálne prenájmy majú rôzne ceny
- **Strata príjmov:** Ak sa počíta menej dní ako by malo

### 2. **Operačné dopady**
- **Nesprávne kilometrové limity:** `dailyKilometers × days` = nesprávny celkový limit
- **Dostupnosť vozidiel:** Kalendár môže ukazovať nesprávne obsadené dni
- **Štatistiky:** Nesprávne reporty o využití vozidiel

### 3. **Používateľské dopady**
- **Zmätok zákazníkov:** Rôzne ceny za rovnaké obdobie
- **Nedôvera v systém:** Nekonzistentné správanie
- **Chyby v protokoloch:** Nesprávne údaje v PDF protokoloch

---

## 🧪 TESTOVÉ SCENÁRE

### Scenár 1: Rovnaký čas
- **Vstup:** 8.9.2024 10:00 → 10.9.2024 10:00
- **Očakávaný výsledok:** 2 dni
- **Logika:** Končí v rovnaký čas = neprekračuje do ďalšieho dňa

### Scenár 2: O minútu neskôr
- **Vstup:** 8.9.2024 10:00 → 10.9.2024 10:01
- **Očakávaný výsledok:** 3 dni
- **Logika:** Prekračuje čas = počíta sa ďalší deň

### Scenár 3: Skôr v ten istý deň
- **Vstup:** 8.9.2024 15:00 → 8.9.2024 17:00
- **Očakávaný výsledok:** 1 deň
- **Logika:** Ten istý deň = 1 deň

### Scenár 4: Cez polnoc
- **Vstup:** 8.9.2024 23:00 → 9.9.2024 01:00
- **Očakávaný výsledok:** 2 dni
- **Logika:** Prekračuje polnoc = 2 dni

### Scenár 5: Presne polnoc
- **Vstup:** 8.9.2024 10:00 → 10.9.2024 00:00
- **Očakávaný výsledok:** 2 dni
- **Logika:** Končí o polnoci = neprekračuje do ďalšieho dňa

### Scenár 6: Po polnoci
- **Vstup:** 8.9.2024 10:00 → 10.9.2024 00:01
- **Očakávaný výsledok:** 3 dni
- **Logika:** Prekračuje polnoc = počíta sa ďalší deň

---

## ⚠️ RIZIKÁ IMPLEMENTÁCIE

### 1. **Vysoké riziko**
- **Zmena existujúcich prenájmov:** Môže ovplyvniť už vytvorené prenájmy
- **Finančné nesrovnalosti:** Zmena cien už potvrdených prenájmov
- **Databázová integrita:** Nekonzistentné dáta v histórii

### 2. **Stredné riziko**
- **Kalendár dostupnosti:** Môže sa zmeniť zobrazenie obsadených dní
- **Štatistiky:** Historické reporty sa môžu zmeniť
- **API kompatibilita:** Zmena správania pre existujúcich klientov

### 3. **Nízke riziko**
- **UI komponenty:** Zmena zobrazenia počtu dní
- **Validácie:** Nové kontroly vstupov

---

## 🎯 NAVRHOVANÁ IMPLEMENTÁCIA

### 1. **Nová centrálna funkcia**
```typescript
// src/utils/rentalDaysCalculator.ts
export function calculateRentalDays(startDate: Date, endDate: Date): number {
  // Ak je endDate skôr ako startDate, vráť 0
  if (endDate < startDate) {
    return 0;
  }
  
  // Ak je to ten istý deň, vráť 1
  if (startDate.toDateString() === endDate.toDateString()) {
    return 1;
  }
  
  // Vypočítaj rozdiel v milisekundách
  const timeDiff = endDate.getTime() - startDate.getTime();
  
  // Konvertuj na dni a zaokrúhli nahor
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  // Vráť minimálne 1 deň
  return Math.max(1, daysDiff);
}
```

### 2. **Migračný plán**
1. **Fáza 1:** Vytvorenie novej funkcie s testami
2. **Fáza 2:** Postupná migrácia frontend komponentov
3. **Fáza 3:** Migrácia backend endpointov
4. **Fáza 4:** Validácia a testovanie
5. **Fáza 5:** Cleanup starých implementácií

### 3. **Spätná kompatibilita**
- **Zachovanie existujúcich prenájmov:** Nezmeniť už vytvorené záznamy
- **Nové prenájmy:** Používať novú logiku
- **Migračný flag:** Možnosť prepínania medzi starým a novým výpočtom

---

## 📊 OVPLYVNENÉ SÚBORY

### Frontend (9 súborov)
1. `src/components/rentals/RentalForm.tsx` ⚠️ **KRITICKÉ**
2. `src/components/customers/CustomerRentalHistory.tsx`
3. `src/components/Statistics.tsx`
4. `src/components/rentals/EditRentalDialog.tsx`
5. `src/components/statistics/TopStatsTab.tsx`
6. `src/utils/formatters.ts`
7. `src/components/vehicles/components/VehicleTable.tsx`
8. `src/components/availability/AvailabilityCalendar.tsx`
9. `src/components/availability/AddUnavailabilityModal.tsx`

### Backend (3 súbory)
1. `backend/src/routes/email-management.ts` ⚠️ **KRITICKÉ**
2. `backend/src/routes/availability.ts`
3. `backend/src/routes/rentals.ts` (možno ovplyvnené)

---

## 🔧 IMPLEMENTAČNÉ KROKY

### Krok 1: Príprava
- [ ] Vytvorenie novej utility funkcie
- [ ] Napísanie kompletných unit testov
- [ ] Validácia na testovacích dátach

### Krok 2: Frontend migrácia
- [ ] `RentalForm.tsx` - najkritickejší súbor
- [ ] `CustomerRentalHistory.tsx`
- [ ] `Statistics.tsx`
- [ ] Ostatné komponenty

### Krok 3: Backend migrácia
- [ ] `email-management.ts`
- [ ] `availability.ts`
- [ ] Testovanie API endpointov

### Krok 4: Validácia
- [ ] End-to-end testovanie
- [ ] Porovnanie s existujúcimi dátami
- [ ] Performance testing

### Krok 5: Deployment
- [ ] Staging deployment
- [ ] Production deployment s rollback plánom
- [ ] Monitoring a alerting

---

## 🚀 ODPORÚČANIA

1. **Postupná implementácia:** Nie všetko naraz, ale po častiach
2. **Dôkladné testovanie:** Každý scenár musí byť otestovaný
3. **Backup dát:** Pred zmenou urobiť zálohu kritických dát
4. **Rollback plán:** Možnosť rýchleho vrátenia zmien
5. **Monitoring:** Sledovanie správania po nasadení

---

## ❓ OTÁZKY PRE ROZHODNUTIE

1. **Chceme zmeniť existujúce prenájmy alebo len nové?**
2. **Máme urobiť migráciu všetkých súborov naraz alebo postupne?**
3. **Potrebujeme zachovať starú logiku ako fallback?**
4. **Ako riešiť nekonzistentné historické dáta?**
5. **Kedy je najlepší čas na nasadenie?**

---

*Dokument vytvorený: ${new Date().toISOString()}*
*Autor: AI Assistant*
*Verzia: 1.0*
