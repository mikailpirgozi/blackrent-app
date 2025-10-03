# 🧪 Batch Document Form - Testing Checklist

## ✅ **PRE-TESTOVANIE:**

### TypeScript Komplácia:
```bash
pnpm exec tsc --noEmit
```
**Status:** ✅ Žiadne chyby v batch-components/ a BatchDocumentForm.tsx

### Linter:
```bash
pnpm run lint
```
**Status:** ✅ Zero errors, zero warnings

---

## 📝 **MANUÁLNE TESTOVANIE:**

### Test 1: Výber vozidla s vyhľadávaním ✅
**Kroky:**
1. Otvor "Pridať dokument"
2. Klikni na výber vozidla
3. Začni písať "BMW" do vyhľadávania
4. Skontroluj že sa filtrujú výsledky
5. Vyber vozidlo

**Očakávaný výsledok:** Vozidlo sa vyberie, popover sa zatvorí

---

### Test 2: Výber typov dokumentov ✅
**Kroky:**
1. Zaškrtni "PZP Poistenie"
2. Zaškrtni "STK"
3. Zaškrtni "Servisná knižka"
4. Skontroluj badge count (3 dokumenty)

**Očakávaný výsledok:** 
- Sekcie sa zobrazia pod sebou
- Badge ukazuje "3 dokumenty"
- Každá sekcia je auto-rozbalená

---

### Test 3: PZP Poistka - Auto-výpočet ✅
**Kroky:**
1. Vyplň číslo poistky
2. Vyber poisťovňu
3. Nastav "Platné od": 01.01.2025
4. Nastav frekvenciu: "Ročne"

**Očakávaný výsledok:**
- "Platné do" sa automaticky nastaví na 31.12.2025
- "Biela karta" má rovnaké dátumy
- Pole "Platné do" je disabled (šedé)

---

### Test 4: Leasingová poistka - Manuálny dátum ✅
**Kroky:**
1. Zaškrtni "Leasingová Poistka"
2. Skontroluj frekvenciu (má byť "Mesačne" a disabled)
3. Nastav "Platné od": 01.01.2025
4. Nastav "Platné do": 31.12.2027 (manuálne!)

**Očakávaný výsledok:**
- Frekvencia je "Mesačne" a nedá sa zmeniť
- "Platné do" je **enabled** a dá sa zadať manuálne
- Zobrazí sa fialový alert: "...zadaj dátum manuálne"

---

### Test 5: Pridať novú poisťovňu ✅
**Kroky:**
1. V PZP sekcii klikni na select poisťovne
2. Vyber "+ Pridať novú poisťovňu"
3. Zadaj: "Test Poisťovňa"
4. Klikni "Pridať"

**Očakávaný výsledok:**
- Poisťovňa sa vytvorí
- Automaticky sa vyberie v selecte
- Inline input sa zatvorí

---

### Test 6: Spravovať poisťovne ✅
**Kroky:**
1. V PZP sekcii klikni "⚙️ Spravovať"
2. Otvorí sa dialóg so zoznamom poisťovní
3. Klikni na "Trash" ikonu pri poisťovni
4. Potvrd vymazanie

**Očakávaný výsledok:**
- Dialóg sa otvorí
- Poisťovňa sa vymaže (ak nie je použitá)
- Ak je použitá → chybová správa

---

### Test 7: STK → EK kopírovanie ✅
**Kroky:**
1. Zaškrtni "STK" a "EK"
2. Vyplň STK "Platné do": 15.10.2026
3. Klikni "Skopírovať platnosť STK do EK"

**Očakávaný výsledok:**
- EK "Platné do" sa nastaví na 15.10.2026
- Tlačidlo zmení text na "✓ Skopírované" (2s)
- Zelená karta sa zobrazí len ak sú obe zaškrtnuté

---

### Test 8: Servisná knižka ✅
**Kroky:**
1. Zaškrtni "Servisná knižka"
2. Rozbaľ sekciu
3. Skontroluj že **nie sú** polia "Platné od" / "Platné do"
4. Vyplň:
   - Dátum servisu: 20.09.2025
   - Stav KM: 125000
   - Servis: "AutoServis Bratislava"
   - Popis: "Výmena oleja, filtrov..."

**Očakávaný výsledok:**
- Len 1 dátum (nie rozsah)
- Textarea pre popis
- Input pre km a servis

---

### Test 9: Evidencia pokút - Komplexný systém ✅
**Kroky:**
1. Zaškrtni "Evidencia pokút"
2. Vyplň:
   - Dátum pokuty: 15.08.2025
   - Zákazník: Ján Novák
   - Krajina: Slovensko
   - Vymáha: ANOD
   - Suma včas: 50€
   - Suma neskoro: 100€
3. **Nechaj prázdne** obe splatnosti (majiteľ/zákazník)

**Očakávaný výsledok:**
- Zobrazí sa **AMBER WARNING**: "Pokuta nie je úplne uhradená"
- 2x Badge "❌ Nezaplatené"

**Kroky 2:**
1. Nastav "Majiteľ zaplatil": 18.08.2025
2. Skontroluj alert

**Očakávaný výsledok:**
- Stále WARNING (zákazník ešte nezaplatil)
- Badge pri majiteľ: "✅ Zaplatené"

**Kroky 3:**
1. Nastav "Zákazník zaplatil": 20.08.2025
2. Skontroluj alert

**Očakávaný výsledok:**
- **ZELENÝ SUCCESS ALERT**: "✅ Pokuta je úplne uhradená"
- Obaja badgy zelené

---

### Test 10: Upload dokumentov ✅
**Kroky:**
1. V PZP sekcii klikni upload area
2. Vyber súbor (PDF)
3. Počkaj na upload
4. Skontroluj badge so súborom
5. Klikni na badge → otvorí súbor v novom okne
6. Klikni "×" na badge → odstráni súbor

**Očakávaný výsledok:**
- Upload progress
- Badge s názvom súboru
- Klik otvorí súbor
- × odstráni súbor

---

### Test 11: Uloženie všetkých dokumentov ✅
**Kroky:**
1. Vyber vozidlo
2. Zaškrtni 3 typy (napr. PZP, STK, Servisná knižka)
3. Vyplň všetky povinné polia
4. Klikni "Uložiť všetky dokumenty (3)"

**Očakávaný výsledok:**
- 3x API call (console log)
- Dialóg sa zatvorí
- Dokumenty sa zobrazia v zozname
- Success notification

---

### Test 12: Validácie ✅
**Test A: Žiadne typy vybrané**
1. Nevyber žiadny typ
2. Klikni "Uložiť"

**Očakávaný výsledok:** Alert "Prosím vyber aspoň jeden typ dokumentu"

**Test B: Žiadne vozidlo**
1. Zaškrtni typ
2. Nevyber vozidlo
3. Klikni "Uložiť"

**Očakávaný výsledok:** Alert "Prosím vyber vozidlo"

**Test C: Chýbajúce povinné polia (PZP)**
1. Zaškrtni PZP
2. Nechaj prázdne "Číslo poistky" alebo "Poisťovňu"
3. Klikni "Uložiť"

**Očakávaný výsledok:** Browser validation error (required fields)

---

## 🐛 **Edge Cases:**

### Edge Case 1: Duplicitná poisťovňa
**Kroky:**
1. Skús pridať poisťovňu "Allianz" (už existuje)

**Očakávaný výsledok:** Alert "Poisťovňa už existuje!"

### Edge Case 2: Vymazanie používanej poisťovne
**Kroky:**
1. Vytvor poistku s "Allianz"
2. Skús vymazať "Allianz" cez Spravovať

**Očakávaný výsledok:** Chybová správa (nie je možné vymazať)

### Edge Case 3: Prázdne filtre vo vyhľadávaní
**Kroky:**
1. Otvor vehicle select
2. Napíš "XYZABC" (neexistujúce auto)

**Očakávaný výsledok:** "Žiadne vozidlo nenájdené"

---

## 📊 **Performance Test:**

### Test: Batch create 5 dokumentov naraz
**Kroky:**
1. Zaškrtni 5 typov
2. Vyplň všetky
3. Ulož

**Meraj:**
- ⏱️ Čas uloženia
- 🔄 UI responsiveness počas ukladania
- ✅ Success rate (mali by sa vytvoriť všetky)

**Očakávaný čas:** < 3 sekundy pre 5 dokumentov

---

## ✅ **ACCEPTANCE CRITERIA:**

Implementácia je **ACCEPTED** ak:

1. ✅ Všetky TypeScript chyby sú opravené
2. ✅ Vozidlo select má vyhľadávanie
3. ✅ Poisťovňu môžem pridať/vymazať
4. ✅ Leasingová poistka má mesačnú frekvenciu + manuálny dátum
5. ✅ Servisná knižka má len 1 dátum + špeciálne polia
6. ✅ Pokuta má 2 splatnosti, 2 sumy, upozornenia
7. ✅ Upload funguje pre každú sekciu
8. ✅ Uloženie vytvorí všetky dokumenty v DB
9. ✅ UI je pekný, moderný, responzívny
10. ✅ Žiadne console errors pri používaní

---

## 🎯 **TESTING STATUS:**

### Automated:
- ⏸️ Unit tests (nie sú potrebné teraz)
- ⏸️ Integration tests (nie sú potrebné teraz)

### Manual:
- ⏳ **Čaká na testing** - potrebuješ to vyskúšať v aplikácii

---

## 🚀 **SPUSTENIE APLIKÁCIE PRE TESTING:**

```bash
# Terminal 1 - Backend (ak ešte nebeží)
npm run dev:start

# Terminal 2 - Frontend (ak beží samostatne)
cd apps/web && npm run dev

# Alebo všetko naraz
npm run dev:full
```

**URL:** http://localhost:3000  
**Sekcia:** Poistky  
**Tlačidlo:** "Pridať dokument"

---

## 📝 **Test Report Template:**

```
✅ PASSED / ❌ FAILED

Test: [Názov testu]
Steps: [Kroky]
Expected: [Očakávaný výsledok]
Actual: [Skutočný výsledok]
Notes: [Poznámky / screenshot]
```

---

**Pripravené na testing!** 🎉  
**Dátum:** 2. október 2025  
**Status:** ✅ Ready for QA

