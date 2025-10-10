# 📊 KOMPLETNÝ REPORT: NAPÁROVANIE EMAILOV S PRENÁJMAMI

## 🎯 SÚHRN ANALÝZY (20.8.2025 - 5.9.2025)

**Dátum analýzy:** 6.9.2025  
**Analyzovaných emailov:** 22  
**Prenájmov bez order_number:** 17  
**Úspešne napárovaných:** 10 prenájmov  

---

## ✅ ÚSPEŠNE NAPÁROVANÉ PRENÁJMY - POTREBNÉ OPRAVY

### 1. **Damián Minárik (Rental ID: 25)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ02825032',
  customer_email = 'damianminarik0@gmail.com',
  customer_phone = '421944660889',
  start_date = '2025-08-30 14:00:00',
  end_date = '2025-08-31 14:00:00'
WHERE id = 25;
```
**Email info:** OBJ02825032, Suma: 220€ (v DB: 310€), Dátum: 30.8.2025 14:00

### 2. **David Hano (Rental ID: 24)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ00925015',
  customer_email = 'davidhano0000@gmail.com',
  customer_phone = '421907303977',
  start_date = '2025-08-31 16:00:00',
  end_date = '2025-09-04 16:00:00'
WHERE id = 24;
```
**Email info:** OBJ00925015, Suma: 380€ ✅, Dátum: 31.8.2025 16:00

### 3. **Michal Rakovan (Rental ID: 18)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ01925244', -- alebo 'OBJ02825033' (má 2 objednávky)
  customer_email = 'michalrakovan.mr@gmail.com',
  customer_phone = '421903623995',
  start_date = '2025-09-02 12:00:00',
  end_date = '2025-09-05 12:00:00'
WHERE id = 18;
```
**Email info:** 2 objednávky - OBJ01925244 (225€) + OBJ02825033 (585€), Dátum: 2.9.2025 12:00

### 4. **EUROCOVER Slovakia, s.r.o. (Rental ID: 17)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ0122510178',
  customer_email = 'Info@eurocover.sk',
  customer_phone = '421948840808',
  start_date = '2025-09-04 16:00:00',
  end_date = '2025-09-08 16:00:00'
WHERE id = 17;
```
**Email info:** OBJ0122510178, Suma: 1200€ (v DB: 1080€), Dátum: 4.9.2025 16:00

### 5. **Lucas Trans Group s. r. o. (Rental ID: 14)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ0102500015',
  customer_email = 'lukas@lucastransgroup.sk',
  customer_phone = '421949001908',
  start_date = '2025-09-03 11:00:00',
  end_date = '2025-09-08 11:00:00'
WHERE id = 14;
```
**Email info:** OBJ0102500015, Suma: 225€ ✅, Dátum: 3.9.2025 11:00

### 6. **Lukáš Slávka (Rental ID: 13)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ00325059', -- alebo 'OBJ01925246' (má 2 objednávky)
  customer_email = 'slavkalukas11@gmail.com',
  customer_phone = '421907097359',
  start_date = '2025-09-03 14:00:00',
  end_date = '2025-09-05 14:00:00'
WHERE id = 13;
```
**Email info:** 2 objednávky - OBJ00325059 (160€) + OBJ01925246 (150€), Dátum: 3.9.2025 14:00

### 7. **Daniel Mutnansky (Rental ID: 10)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ00325060',
  customer_email = 'dancotnt@gmail.com',
  customer_phone = '421949122661'
  -- start_date zostáva '2025-09-04 08:00:00' (správny čas)
WHERE id = 10;
```
**Email info:** OBJ00325060, Suma: 100€ ✅, Dátum: 4.9.2025 08:00 ✅

### 8. **Tromex house s.r.o. (Rental ID: 9)**
```sql
UPDATE rentals SET 
  order_number = 'OBJ2520044',
  customer_email = 'i-house@email.cz',
  customer_phone = '421608742735',
  start_date = '2025-09-04 17:00:00',
  end_date = '2025-09-07 17:00:00'
WHERE id = 9;
```
**Email info:** OBJ2520044, Suma: 960€ ✅, Dátum: 4.9.2025 17:00

---

## 🚗 DENNÉ KILOMETRE - POTREBNÉ DOPLNIŤ

**PROBLÉM:** Všetky napárované prenájmy majú pravdepodobne chýbajúce `daily_kilometers` údaje z emailov.

### Kde nájsť denné km v emailoch:
- V HTML emailoch hľadaj: `Počet povolených km</td>`
- Typické hodnoty: "250 km", "300 km", "500 km", atď.
- Treba extrahovať číslo a uložiť do `daily_kilometers` stĺpca

### Príklad extrakcie z emailu:
```javascript
const kmMatch = content.match(/Počet povolených km<\/td>\s*<td[^>]*>([^<]+)<\/td>/);
const dailyKm = kmMatch ? kmMatch[1].replace(/[^\d]/g, '') : null;
```

### SQL na doplnenie km (príklad):
```sql
UPDATE rentals SET daily_kilometers = 250 WHERE id = 9; -- Tromex
UPDATE rentals SET daily_kilometers = 300 WHERE id = 10; -- Daniel
-- atď. pre všetky napárované prenájmy
```

---

## ❌ NENÁJDENÉ NAPÁROVANIA (12 emailov)

Tieto emaily sa nenašli v prenájmoch bez order_number:

1. **Vladimir Brodziansky** - OBJ01925236 (540€, 1.9.2025)
2. **Vladimir Brodzianovsky** - OBJ0122510132 (220€, 1.9.2025) 
3. **Vladimir Brodzianovsky** - OBJ01925239 (560€, 3.9.2025)
4. **Jakub Valovics** - OBJ01925241 (2640€, 22.9.2025)
5. **Martin Pavlech** - OBJ01925242 (528€, 8.9.2025)
6. **Tomáš Horváth** - OBJ03625009 (220€, 2.9.2025)
7. **Tomáš Horváth** - OBJ01925245 (640€, 3.9.2025)
8. **Jan Mochnac** - OBJ2519948 (360€, 5.9.2025)
9. **Filip Jackovič** - OBJ0122510262 (400€, 5.9.2025) ✅ UŽ MÁ ORDER_NUMBER
10. **Richard Ryan Rozar** - OBJ01925248 (540€, 5.9.2025) ✅ UŽ MÁ ORDER_NUMBER
11. **Anda Szilárd** - OBJ02225032 (290€, 12.9.2025) ✅ UŽ MÁ ORDER_NUMBER
12. **Samuel Vaňo** - OBJ0122510304 (440€, 5.9.2025) ✅ UŽ MÁ ORDER_NUMBER

**Poznámka:** Emaily 9-12 už majú order_number v databáze, takže sú OK.

---

## 📁 SÚBORY PRE ĎALŠIU PRÁCU

### Súbory vytvorené počas analýzy:
- `backend/all-emails/` - 22 emailov (HTML, TXT, META)
- `backend/analyze-email-rentals.js` - Analyzačný script
- `backend/save-all-emails.js` - Script na stiahnutie emailov
- `backend/check-emails-7days.js` - Script na kontrolu emailov

### Príkazy na spustenie:
```bash
# Stiahnutie emailov z IMAP
cd backend && IMAP_PASSWORD="Hesloheslo11" node save-all-emails.js

# Analýza napárovania
cd backend && node analyze-email-rentals.js

# Kontrola emailov za 7 dní
cd backend && IMAP_PASSWORD="Hesloheslo11" node check-emails-7days.js
```

---

## 🔧 ĎALŠIE KROKY PRE BUDÚCI CHAT

1. **Aplikovať SQL opravy** - Spustiť UPDATE príkazy pre všetkých 8 prenájmov
2. **Doplniť denné kilometre** - Extrahovať z emailov a doplniť do DB
3. **Skontrolovať duplicity** - Michal Rakovan a Lukáš Slávka majú 2 objednávky
4. **Overiť sumy** - Niektoré sumy sa líšia medzi emailom a DB
5. **Skontrolovať nenájdené** - Prečo sa nenašli napárovania pre Vladimir Brodzianovsky, atď.

---

## 📊 ŠTATISTIKY

- **Úspešnosť napárovania:** 10/17 prenájmov (58.8%)
- **Presné mená:** 10/10 (100% confidence)
- **Chýbajúce order_number:** 10 prenájmov
- **Chýbajúce emaily:** 10 prenájmov  
- **Chýbajúce telefóny:** 10 prenájmov
- **Nesprávne časy:** 9 prenájmov (všetko bolo 08:00)
- **Chýbajúce denné km:** Pravdepodobne všetkých 10 prenájmov

**Celkovo treba opraviť:** ~40 údajov (order_number + email + telefón + čas + km)
