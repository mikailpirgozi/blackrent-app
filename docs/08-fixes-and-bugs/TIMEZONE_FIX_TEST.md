# ✅ TIMEZONE FIX - TESTOVACÍ SCENÁR

## 🎯 Cieľ
Overiť, že dátumy v expenses sa **už NIKDY nezmenia** pri editácii.

---

## 📋 PRED TESTOM

### 1. Spusti database migration

```bash
cd backend/migrations
export PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv
./run-timezone-fix.sh
```

**Očakávaný výstup:**
```
✅ Migration completed successfully!
📊 Summary:
  - expenses.date: TIMESTAMP → DATE
  - recurring_expenses dates: TIMESTAMP → DATE
```

---

## 🧪 TEST 1: Nový Expense

### Kroky:
1. Otvor aplikáciu na http://localhost:3000
2. Prejdi na **Náklady** sekciu
3. Klikni **Pridať náklad**
4. Zadaj:
   - **Popis:** Test timezone fix
   - **Suma:** 100€
   - **Dátum:** **15. január 2025**
   - **Firma:** Black Holding
   - **Kategória:** Iné
5. Ulož

### ✅ Overenie:
- [ ] Expense sa vytvoril
- [ ] V zozname vidíš dátum **15.01.2025**
- [ ] Žiadny error v console

---

## 🧪 TEST 2: Edit Expense - Bez Zmeny Dátumu

### Kroky:
1. Nájdi práve vytvorený expense
2. Klikni **Upraviť** (ikona ceruzky)
3. **NEKLIKAJ na DatePicker!**
4. Zmeň len sumu: **150€**
5. Ulož

### ✅ Overenie:
- [ ] Suma sa zmenila na 150€
- [ ] Dátum je **STÁLE 15.01.2025** ✅
- [ ] **NIE 14.01.2025!** ❌

---

## 🧪 TEST 3: Edit Expense - So Zmenou Dátumu

### Kroky:
1. Znova klikni **Upraviť**
2. Zmeň dátum na **20. január 2025**
3. Ulož

### ✅ Overenie:
- [ ] Dátum sa zmenil na **20.01.2025**
- [ ] Po refresh stránky stále **20.01.2025**

---

## 🧪 TEST 4: CSV Import

### Kroky:
1. Vytvor `test.csv` súbor:
```csv
Popis,Suma,Dátum,Kategória,Firma
Test CSV 1,50,15.01.2025,fuel,Black Holding
Test CSV 2,75,16.01.2025,service,Black Holding
```

2. Klikni **Import CSV**
3. Vyber `test.csv`
4. Čakaj na import

### ✅ Overenie:
- [ ] Import úspešný (toast notifikácia)
- [ ] Expense 1 má dátum **15.01.2025**
- [ ] Expense 2 má dátum **16.01.2025**
- [ ] Po refresh stále rovnaké dátumy

---

## 🧪 TEST 5: Recurring Expenses

### Kroky:
1. Klikni **Pravidelné náklady**
2. Pridaj nový pravidelný náklad:
   - **Názov:** Test mesačný náklad
   - **Suma:** 200€
   - **Frekvencia:** Mesačne
   - **Začiatok:** **1. február 2025**
   - **Deň v mesiaci:** 1
3. Ulož
4. Klikni **Vygenerovať teraz** (ikona play)

### ✅ Overenie:
- [ ] Vygeneroval sa expense s dátumom **1. február 2025**
- [ ] Po editácii dátum zostáva **1.02.2025**

---

## 🧪 TEST 6: Rôzne Timezones (Advanced)

### Kroky:
1. Otvor Chrome DevTools (F12)
2. Prejdi na **Sensors** tab
3. Zmenit Location na **Tokyo** (UTC+9)
4. Refresh stránku
5. Vytvor nový expense s dátumom **15.01.2025**
6. Zmeň Location späť na **Bratislava** (UTC+1)
7. Refresh a over expense

### ✅ Overenie:
- [ ] Dátum je **STÁLE 15.01.2025** v oboch timezone!
- [ ] Žiadny posun o dni/hodiny

---

## 📊 VÝSLEDOK

### Všetky testy prešli? ✅

```
✅ TEST 1: Nový expense - PASSED
✅ TEST 2: Edit bez zmeny dátumu - PASSED  
✅ TEST 3: Edit so zmenou dátumu - PASSED
✅ TEST 4: CSV import - PASSED
✅ TEST 5: Recurring expenses - PASSED
✅ TEST 6: Timezone test - PASSED
```

**🎉 TIMEZONE FIX JE KOMPLETNÝ!**

Dátumy sa už **NIKDY nezmenia** pri editácii expenses!

---

## ❌ Ak niektorý test ZLYHÁ

1. **Skontroluj console errors** (F12 → Console)
2. **Skontroluj Network tab** - pozri API response
3. **Over database migration** - spusti znova
4. **Skontroluj backend logs**
5. **Nahlas mi chybu** s detailmi!

---

## 🔄 ROLLBACK (ak treba)

```bash
cd backend/migrations
export PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv

# Najdi posledný backup
ls -lt backup_before_timezone_fix_*.sql | head -1

# Restore
psql -h trolley.proxy.rlwy.net -U postgres -p 13400 -d railway < backup_filename.sql
```

---

**Autor:** AI Assistant  
**Dátum:** 2025-01-04  
**Status:** READY FOR TESTING 🚀

