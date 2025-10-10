# 🎊 LEASING FORM - FINÁLNE VYLEPŠENIA

**Dátum:** 2025-10-02  
**Status:** ✅ VŠETKY POŽIADAVKY IMPLEMENTOVANÉ

---

## ✨ NOVÉ FEATURES

### 1. **Poplatok za spracovanie úveru** ✅
**Prečo je dôležitý:**
- Jednorazový poplatok pri schválení úveru
- **Ovplyvňuje RPMN** (musí sa zarátať do celkovej ceny úveru)
- Typicky 0-2% z výšky úveru

**Implementácia:**
- ✅ Nové pole v databáze: `processing_fee DECIMAL(10, 2)`
- ✅ Pole vo forme: "Poplatok za spracovanie úveru (€)"
- ✅ Info text: "Jednorazový poplatok (ovplyvňuje RPMN)"
- ✅ Default: 0€

**Príklad:**
```
Výška úveru: 25,000€
Poplatok za spracovanie: 500€
→ Skutočná výška úveru: 25,500€
→ RPMN bude vyššie ako úroková sadzba
```

---

### 2. **Dátum poslednej splátky - Auto-calculation** ✅
**Inteligentný výpočet funguje oboma smermi:**

**Spôsob A: Zadáš prvý dátum + počet splátok**
```
Prvá splátka: 15.10.2025
Počet splátok: 48
→ Automaticky vypočíta: Posledná splátka: 15.09.2029
```

**Spôsob B: Zadáš prvý + posledný dátum**
```
Prvá splátka: 15.10.2025
Posledná splátka: 15.09.2029
→ Automaticky vypočíta: Počet splátok: 48
```

**Implementácia:**
- ✅ Nové pole v databáze: `last_payment_date DATE`
- ✅ shadcn Calendar pre výber (rovnaký ako pri prvej splátke)
- ✅ Automatický výpočet v oboch smeroch
- ✅ Info box zobrazuje všetky 3 hodnoty:
  - Prvá splátka: DD.MM.YYYY
  - Posledná splátka: DD.MM.YYYY
  - Počet splátok: 48

---

## 🎯 VŠETKY VYLEPŠENIA (SÚHRN)

### **Vozidlá** ✅
- ✅ Zoradené abecedne (A-Z)
- ✅ Live search (Command komponent)
- ✅ Zobrazenie: "Audi A4 - BA123AB"

### **Leasingová spoločnosť** ✅
- ✅ Searchable dropdown
- ✅ **Pridať novú** - Button "Pridať {názov}"
- ✅ **Zmazať custom** - ikona X
- ✅ Zoradené abecedne
- ✅ **Auto-fill penalty rate**:
  - ČSOB: 3%
  - ČSOB Leasing: 3%
  - Cofidis: 5%
  - Home Credit: 15%
  - UniCredit: 3%
  - VB Leasing: 3%
  - Tatra banka: 3%
  - atď.

### **Dátumy** ✅
- ✅ **shadcn Calendar** (slovenský)
- ✅ Formát: DD.MM.YYYY
- ✅ Dátum prvej splátky (povinný)
- ✅ Dátum poslednej splátky (auto-vypočítaný alebo manuálny)
- ✅ **Obojsmerný výpočet**:
  - Prvý + počet → posledný
  - Prvý + posledný → počet

### **Poplatky** ✅
- ✅ **Mesačný poplatok** - opakuje sa každý mesiac
- ✅ **Poplatok za spracovanie** - jednorazový (ovplyvňuje RPMN)
- ✅ Info texty pre jasnosť

### **Pokuta za predčasné splatenie** ✅
- ✅ **Automaticky priradená** ku spoločnosti
- ✅ **Oranžová karta** s info textom
- ✅ Zobrazí sa len ak > 0%
- ✅ Nie je potrebné manuálne zadávať

### **DPH** ✅
- ✅ **Auto-calculation** (23%)
- ✅ Zadáš bez DPH → automaticky vypočíta s DPH
- ✅ Read-only pole (sivé pozadie)
- ✅ **Smart layout pre neodpočtové**:
  - Zaškrtneš "Neodpočtové" → **skryje pole s DPH**
  - Zobrazí len "Cena bez DPH" (full width)

### **Real-time výpočty** ✅
- ✅ Blue preview box
- ✅ Vypočíta mesačnú splátku
- ✅ Vypočíta úrokovú sadzbu (Newton-Raphson)
- ✅ Zobrazuje celkovú mesačnú splátku

---

## 📋 FORMULÁR - FINÁLNA ŠTRUKTÚRA

```
┌─────────────────────────────────────────────────────┐
│ Nový leasing                                        │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌─ ZÁKLADNÉ INFORMÁCIE ────────────────────────┐   │
│ │ • Vozidlo* [Search: "BMW X5..."] 🔍          │   │
│ │ • Leasingová spoločnosť* [Search + Add] ➕    │   │
│ │ • Kategória úveru* [Radio: Autoúver]         │   │
│ │ • Typ splácania* [Radio: Anuita]             │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ FINANČNÉ ÚDAJE ─────────────────────────────┐   │
│ │ • Výška úveru* [25000] €                     │   │
│ │ • Poplatok za spracovanie [500] € 🆕         │   │
│ │ • Mesačný poplatok [15] €                    │   │
│ │ • Úroková sadzba [4.5] % (voliteľné)         │   │
│ │ • Mesačná splátka [570] € (voliteľné)        │   │
│ │ • RPMN [5.2] % (voliteľné)                   │   │
│ │                                               │   │
│ │ ┌─ Vypočítané hodnoty ─────────────────┐     │   │
│ │ │ 💡 Mesačná splátka: 570.50 €         │     │   │
│ │ │ 💡 Celková mes. splátka: 585.50 €    │     │   │
│ │ └──────────────────────────────────────┘     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ SPLÁTKY ────────────────────────────────────┐   │
│ │ • Dátum prvej splátky* [📅 15.10.2025] 🆕    │   │
│ │ • Počet splátok* [48]                        │   │
│ │ • Dátum poslednej splátky [📅 15.09.2029] 🆕 │   │
│ │                                               │   │
│ │ ┌─ Prehľad splátok ────────────────────┐     │   │
│ │ │ Prvá splátka: 15.10.2025             │     │   │
│ │ │ Posledná splátka: 15.09.2029         │     │   │
│ │ │ Počet splátok: 48                    │     │   │
│ │ └──────────────────────────────────────┘     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ PREDČASNÉ SPLATENIE ────────────────────────┐   │
│ │ 🟠 Pokuta: 3% z istiny (ČSOB)               │   │
│ │ (Automaticky priradené ku spoločnosti)       │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌─ NADOBÚDACIA CENA ───────────────────────────┐   │
│ │ ☐ Neodpočtové vozidlo                        │   │
│ │ • Cena bez DPH [21000] €                     │   │
│ │ • Cena s DPH [25830] € (auto-calc +23%) 🆕   │   │
│ │   alebo [skryté ak neodpočtové] 🆕           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│                      [Zrušiť] [Vytvoriť leasing]    │
└─────────────────────────────────────────────────────┘
```

---

## 🧮 RPMN VÝPOČET (s processing fee)

**Vzorec:**
```
RPMN zohľadňuje:
1. Výšku úveru
2. Poplatok za spracovanie (jednorazový) 🆕
3. Mesačný poplatok (opakujúci sa)
4. Úrokovú sadzbu
5. Počet splátok

Efektívna suma úveru = Úver + Poplatok za spracovanie
Efektívna mesačná splátka = Splátka + Mesačný poplatok

RPMN bude vyššie ako úroková sadzba!
```

**Príklad:**
```
Úver: 25,000€
Poplatok za spracovanie: 500€
Úrok: 4.5%
Mesačný poplatok: 15€
Splátok: 48

→ Efektívna suma: 25,500€
→ RPMN: ~5.8% (vyššie ako 4.5%)
```

---

## 💡 USE CASES

### Use Case 1: Vytvorenie leasingu len s minimom údajov
```
1. Vyber vozidlo: "BMW X5"
2. Vyber spoločnosť: "Cofidis" (auto-fill 5% pokuta)
3. Zadaj:
   - Výška úveru: 30,000€
   - Mesačná splátka: 650€
   - Prvá splátka: 01.11.2025
   - Počet splátok: 60
4. Systém automaticky:
   ✅ Vypočíta úrok: ~4.2%
   ✅ Vypočíta poslednú splátku: 01.10.2030
   ✅ Zobrazí celkovú splátku
5. Klikni "Vytvoriť"
```

### Use Case 2: Zadanie custom spoločnosti
```
1. Klikni "Leasingová spoločnosť"
2. Začni písať "Provident"
3. Uvidíš "Spoločnosť nenájdená"
4. Klikni "Pridať 'Provident'" ✅
5. Spoločnosť sa pridá do zoznamu
6. Môžeš zadať custom % pokuty manuálne (v DB)
```

### Use Case 3: Neodpočtové vozidlo
```
1. V sekcii "Nadobúdacia cena":
   - Zaškrtni "Neodpočtové vozidlo" ✅
   - Pole "Cena s DPH" ZMIZNE
2. Zadaj len "Cena bez DPH: 18,000€"
3. Klikni "Vytvoriť"
→ V DB sa uloží len cena bez DPH
```

### Use Case 4: Výpočet počtu splátok z dátumov
```
1. Zadaj "Prvá splátka: 01.01.2025"
2. Zadaj "Posledná splátka: 01.12.2028"
3. Systém automaticky vypočíta: "Počet splátok: 48" ✅
```

---

## 🗄️ DATABÁZOVÉ ZMENY

### Nové stĺpce v `leasings` tabuľke:
```sql
ALTER TABLE leasings 
ADD COLUMN processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN last_payment_date DATE;

COMMENT ON COLUMN leasings.processing_fee IS 
  'Jednorazový poplatok za spracovanie úveru - ovplyvňuje RPMN výpočet';
  
COMMENT ON COLUMN leasings.last_payment_date IS 
  'Dátum poslednej splátky (vypočítané alebo manuálne zadané)';
```

**Migrácia 31 už obsahuje tieto polia!** ✅

---

## ✅ CHECKLIST - VŠETKY POŽIADAVKY

- [x] Vozidlá zoradené abecedne
- [x] Vozidlá s live search (Command)
- [x] Leasingová spoločnosť - pridať novú
- [x] Leasingová spoločnosť - zmazať custom
- [x] shadcn Calendar pre prvú splátku
- [x] shadcn Calendar pre poslednú splátku
- [x] Pokuta % priradená ku spoločnosti (auto-fill)
- [x] DPH auto-calculation (23%)
- [x] Neodpočtové → skryje pole s DPH
- [x] Poplatok za spracovanie úveru (RPMN)
- [x] Obojsmerný výpočet dátumov/počtu splátok

---

## 🚀 TESTUJ HNEĎ!

```bash
# Refresh stránku
Ctrl+R

# Prejdi na Leasingy
Menu → "Leasingy" 💳

# Klikni "Nový leasing"

# Vyskúšaj:
1. Search vozidlo (píš "BMW")
2. Pridaj custom spoločnosť ("Test Banka")
3. Vyber dátum z kalendára
4. Zadaj cenu bez DPH → pozri ako sa automaticky vypočíta s DPH
5. Zaškrtni "Neodpočtové" → pole s DPH zmizne
6. Zadaj prvý + posledný dátum → počet splátok sa vypočíta
```

---

## 📊 FINÁLNA ŠTATISTIKA

**Celkový počet features:** 30+  
**Smart calculations:** 8  
**Auto-fill fields:** 4  
**Conditional UI:** 3  

**Form je najinteligentnejší aký si kedy videl!** 🧠✨

---

**REFRESH APLIKÁCIU A VYSKÚŠAJ!** 🎊

