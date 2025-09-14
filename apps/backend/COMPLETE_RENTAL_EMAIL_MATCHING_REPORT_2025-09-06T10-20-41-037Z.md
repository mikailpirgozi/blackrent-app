# 📊 KOMPLETNÝ REPORT: NAPÁROVANIE VŠETKÝCH PRENÁJMOV S EMAILAMI

**Dátum analýzy:** 6. 9. 2025 12:20:41
**Analyzované obdobie:** 2025-08-20 - 2025-09-05
**Prenájmov v databáze:** 79
**Emailov z IMAP:** 44
**Úspešných napárovaní:** 35

---

## ✅ ÚSPEŠNE NAPÁROVANÉ PRENÁJMY - SQL OPRAVY

### 1. **Filip Jackovič (Rental ID: 553)**
```sql
UPDATE rentals SET customer_email = 'f.jackovic@gmail.com', customer_phone = '421917290628', daily_kilometers = 210, start_date = '2025-09-05 15:00:00', end_date = '2025-09-09 15:00:00' WHERE id = 553;
```
**Email info:** OBJ0122510262, Suma: 400.008364€ ✅, Dátum: 2025-09-05 15:00:00

### 2. **Richard Ryan Rozar (Rental ID: 556)**
```sql
UPDATE rentals SET customer_email = 'richardrozar3@gmail.com', customer_phone = '421940554558', daily_kilometers = 170, start_date = '2025-09-05 15:00:00', end_date = '2025-09-14 15:00:00' WHERE id = 556;
```
**Email info:** OBJ01925248, Suma: 540.008364€ ✅, Dátum: 2025-09-05 15:00:00

### 3. **Samuel Vaňo (Rental ID: 558)**
```sql
UPDATE rentals SET customer_email = 'Samueletovano@gmail.com', customer_phone = '421917655312', daily_kilometers = 250, start_date = '2025-09-05 16:00:00', end_date = '2025-09-07 16:00:00' WHERE id = 558;
```
**Email info:** OBJ0122510304, Suma: 440.008364€ ✅, Dátum: 2025-09-05 16:00:00

### 4. **Koval  (Rental ID: 68)**
```sql
UPDATE rentals SET order_number = 'OBJ00625084', customer_email = 'm.sebej@gmail.com', customer_phone = '421904678879', daily_kilometers = 210, start_date = '2025-08-21 14:00:00', end_date = '2025-08-28 14:00:00' WHERE id = 68;
```
**Email info:** OBJ00625084, Suma: 1750.008364€ (v DB: 1575€), Dátum: 2025-08-21 14:00:00

### 5. **Lukáš Zemanovic (Rental ID: 37)**
```sql
UPDATE rentals SET order_number = 'OBJ01925225', customer_email = 'PvPCarlikPvP@gmail.com', customer_phone = '421919046103', daily_kilometers = 250, start_date = '2025-08-23 11:00:00', end_date = '2025-08-24 11:00:00' WHERE id = 37;
```
**Email info:** OBJ01925225, Suma: 70.008364€ (v DB: 150€), Dátum: 2025-08-23 11:00:00

### 6. **Michal Rakovan (Rental ID: 18)**
```sql
UPDATE rentals SET order_number = 'OBJ01925226', customer_email = 'michalrakovan.mr@gmail.com', customer_phone = '421903623995', daily_kilometers = 170, start_date = '2025-08-22 13:00:00', end_date = '2025-09-02 13:00:00' WHERE id = 18;
```
**Email info:** OBJ01925226, Suma: 770.008364€ (v DB: 585€), Dátum: 2025-08-22 13:00:00

### 7. **Filip Štadler (Rental ID: 27)**
```sql
UPDATE rentals SET order_number = 'OBJ012259597', customer_email = 'ferenczilaci35@gmail.com', customer_phone = '421911965483', daily_kilometers = 250, start_date = '2025-08-26 17:00:00', end_date = '2025-08-27 17:00:00' WHERE id = 27;
```
**Email info:** OBJ012259597, Suma: 250.008364€ ✅, Dátum: 2025-08-26 17:00:00

### 8. **Kitta (Rental ID: 56)**
```sql
UPDATE rentals SET order_number = 'OBJ01925227', customer_email = 'kitta.peter@gmail.com', customer_phone = '421918284449', daily_kilometers = 250, start_date = '2025-08-25 11:00:00', end_date = '2025-08-28 09:00:00' WHERE id = 56;
```
**Email info:** OBJ01925227, Suma: 960.008364€ ✅, Dátum: 2025-08-25 11:00:00

### 9. **Samuel Čemeš (Rental ID: 40)**
```sql
UPDATE rentals SET order_number = 'OBJ012259757', customer_email = 'cemessamuel4@gmail.com', customer_phone = '421910504222', daily_kilometers = 250, start_date = '2025-08-24 17:00:00', end_date = '2025-08-26 17:00:00' WHERE id = 40;
```
**Email info:** OBJ012259757, Suma: 220.008364€ (v DB: 180€), Dátum: 2025-08-24 17:00:00

### 10. **Samuel Čemeš (Rental ID: 40)**
```sql
UPDATE rentals SET order_number = 'OBJ01925229', customer_email = 'cemessamuel4@gmail.com', customer_phone = '421910504222', daily_kilometers = 250, start_date = '2025-08-24 17:00:00', end_date = '2025-08-26 17:00:00' WHERE id = 40;
```
**Email info:** OBJ01925229, Suma: 120.008364€ (v DB: 180€), Dátum: 2025-08-24 17:00:00

### 11. **Nicolas Malát (Rental ID: 38)**
```sql
UPDATE rentals SET order_number = 'OBJ012259763', customer_email = 'malatnicolas@gmail.com', customer_phone = '421944150369', daily_kilometers = 250 WHERE id = 38;
```
**Email info:** OBJ012259763, Suma: 250.008364€ (v DB: 261€), Dátum: 2025-08-26 08:00:00

### 12. **Lukáš Zemanovic (Rental ID: 37)**
```sql
UPDATE rentals SET order_number = 'OBJ01925231', customer_email = 'PvPCarlikPvP@gmail.com', customer_phone = '421918046103', daily_kilometers = 300, start_date = '2025-08-30 11:00:00', end_date = '2025-08-31 11:00:00' WHERE id = 37;
```
**Email info:** OBJ01925231, Suma: 85.008364€ (v DB: 150€), Dátum: 2025-08-30 11:00:00

### 13. **Pavol Demjanič (Rental ID: 36)**
```sql
UPDATE rentals SET order_number = 'OBJ02225031', customer_email = 'demjanicp@fytopharma.sk', customer_phone = '421918936707', daily_kilometers = 250 WHERE id = 36;
```
**Email info:** OBJ02225031, Suma: 290.008364€ ✅, Dátum: 2025-08-28 08:00:00

### 14. **Martin Mangera (Rental ID: 35)**
```sql
UPDATE rentals SET order_number = 'OBJ012259804', customer_email = 'mmangerotti@gmail.com', customer_phone = '421904802390', daily_kilometers = 170, start_date = '2025-08-28 13:00:00', end_date = '2025-09-05 13:00:00' WHERE id = 35;
```
**Email info:** OBJ012259804, Suma: 1360.008364€ (v DB: 1088€), Dátum: 2025-08-28 13:00:00

### 15. **EUROCOVER Slovakia,
s.r.o. (Rental ID: 17)**
```sql
UPDATE rentals SET order_number = 'OBJ03625008', customer_email = 'marek.mitosinka@gmail.com', customer_phone = '421918642223', daily_kilometers = 210 WHERE id = 17;
```
**Email info:** OBJ03625008, Suma: 1080.008364€ ✅, Dátum: 2025-09-12 08:00:00

### 16. **Matúš Grežďo (Rental ID: 34)**
```sql
UPDATE rentals SET order_number = 'OBJ00925013', customer_email = 'matusgrezdo7@gmail.com', customer_phone = '421908954178', daily_kilometers = 250, start_date = '2025-08-27 15:00:00', end_date = '2025-08-28 15:00:00' WHERE id = 34;
```
**Email info:** OBJ00925013, Suma: 140.008364€ (v DB: 177.8€), Dátum: 2025-08-27 15:00:00

### 17. **Darina Fabušová (Rental ID: 33)**
```sql
UPDATE rentals SET order_number = 'OBJ01925233', customer_email = 'dfabusova@gmail.com', customer_phone = '421908483517', daily_kilometers = 210, start_date = '2025-08-26 13:00:00', end_date = '2025-09-01 13:00:00' WHERE id = 33;
```
**Email info:** OBJ01925233, Suma: 300.008364€ (v DB: 312€), Dátum: 2025-08-26 13:00:00

### 18. **Nazariy Dolyna (Rental ID: 32)**
```sql
UPDATE rentals SET order_number = 'OBJ00625085', customer_email = 'nazar4ik007@icloud.com', customer_phone = '421951438414', daily_kilometers = 210, start_date = '2025-08-27 10:00:00', end_date = '2025-09-03 10:00:00' WHERE id = 32;
```
**Email info:** OBJ00625085, Suma: 315.008364€ ✅, Dátum: 2025-08-27 10:00:00

### 19. **Kristian Fatura (Rental ID: 29)**
```sql
UPDATE rentals SET order_number = 'OBJ01925234', customer_email = 'kristianfatura@icloud.com', customer_phone = '421910668829', daily_kilometers = 170 WHERE id = 29;
```
**Email info:** OBJ01925234, Suma: 440.008364€ (v DB: 495€), Dátum: 2025-08-28 08:00:00

### 20. **Filip Štadler (Rental ID: 27)**
```sql
UPDATE rentals SET order_number = 'OBJ01925235', customer_email = 'Filipsuper70@gmail.com', customer_phone = '421948222752', daily_kilometers = 210, start_date = '2025-08-28 16:00:00', end_date = '2025-09-01 16:00:00' WHERE id = 27;
```
**Email info:** OBJ01925235, Suma: 200.008364€ (v DB: 250€), Dátum: 2025-08-28 16:00:00

### 21. **Ital  (Rental ID: 102)**
```sql
UPDATE rentals SET order_number = 'OBJ00625087', customer_email = 'ado.kollarik@gmail.com', customer_phone = '421948451202', daily_kilometers = 210, start_date = '2025-09-25 12:00:00', end_date = '2025-09-30 12:00:00' WHERE id = 102;
```
**Email info:** OBJ00625087, Suma: 1900.008364€ ✅, Dátum: 2025-09-25 12:00:00

### 22. **Damián Minárik (Rental ID: 25)**
```sql
UPDATE rentals SET order_number = 'OBJ02825032', customer_email = 'damianminarik0@gmail.com', customer_phone = '421944660889', daily_kilometers = 250, start_date = '2025-08-30 14:00:00', end_date = '2025-08-31 14:00:00' WHERE id = 25;
```
**Email info:** OBJ02825032, Suma: 220.008364€ (v DB: 310€), Dátum: 2025-08-30 14:00:00

### 23. **David Hano (Rental ID: 24)**
```sql
UPDATE rentals SET order_number = 'OBJ00925015', customer_email = 'davidhano0000@gmail.com', customer_phone = '421907303977', daily_kilometers = 210, start_date = '2025-08-31 16:00:00', end_date = '2025-09-04 16:00:00' WHERE id = 24;
```
**Email info:** OBJ00925015, Suma: 380.008364€ ✅, Dátum: 2025-08-31 16:00:00

### 24. **Zsindely (Rental ID: 61)**
```sql
UPDATE rentals SET order_number = 'OBJ01925236', customer_email = 'vladobrodziansky@gmail.com', customer_phone = '421915287755', daily_kilometers = 170, start_date = '2025-09-01 11:00:00', end_date = '2025-09-10 11:00:00' WHERE id = 61;
```
**Email info:** OBJ01925236, Suma: 540.008364€ ✅, Dátum: 2025-09-01 11:00:00

### 25. **Valovics (Rental ID: 83)**
```sql
UPDATE rentals SET order_number = 'OBJ01925241', customer_email = 'Jvalovics@gmail.com', customer_phone = '421911579911', daily_kilometers = 170, start_date = '2025-09-22 11:00:00', end_date = '2025-10-03 11:00:00' WHERE id = 83;
```
**Email info:** OBJ01925241, Suma: 2640.008364€ (v DB: 630€), Dátum: 2025-09-22 11:00:00

### 26. **Michal Rakovan (Rental ID: 18)**
```sql
UPDATE rentals SET order_number = 'OBJ01925244', customer_email = 'michalrakovan.mr@gmail.com', customer_phone = '421903623995', daily_kilometers = 250, start_date = '2025-09-02 12:00:00', end_date = '2025-09-05 12:00:00' WHERE id = 18;
```
**Email info:** OBJ01925244, Suma: 225.008364€ (v DB: 585€), Dátum: 2025-09-02 12:00:00

### 27. **Michal Rakovan (Rental ID: 18)**
```sql
UPDATE rentals SET order_number = 'OBJ02825033', customer_email = 'michalrakovan.mr@gmail.com', customer_phone = '421903623995', daily_kilometers = 250, start_date = '2025-09-02 12:00:00', end_date = '2025-09-05 12:00:00' WHERE id = 18;
```
**Email info:** OBJ02825033, Suma: 585.008364€ ✅, Dátum: 2025-09-02 12:00:00

### 28. **EUROCOVER Slovakia,
s.r.o. (Rental ID: 17)**
```sql
UPDATE rentals SET order_number = 'OBJ0122510178', customer_email = 'Info@eurocover.sk', customer_phone = '421948840808', daily_kilometers = 210, start_date = '2025-09-04 16:00:00', end_date = '2025-09-08 16:00:00' WHERE id = 17;
```
**Email info:** OBJ0122510178, Suma: 1200.008364€ (v DB: 1080€), Dátum: 2025-09-04 16:00:00

### 29. **Sukennik (Rental ID: 52)**
```sql
UPDATE rentals SET order_number = 'OBJ01925245', customer_email = 'horvathtomas1@gmail.com', customer_phone = '421915788123', daily_kilometers = 250, start_date = '2025-09-03 13:00:00', end_date = '2025-09-05 10:00:00' WHERE id = 52;
```
**Email info:** OBJ01925245, Suma: 640.008364€ ✅, Dátum: 2025-09-03 13:00:00

### 30. **Lucas Trans Group s. r.
o. (Rental ID: 14)**
```sql
UPDATE rentals SET order_number = 'OBJ0102500015', customer_email = 'lukas@lucastransgroup.sk', customer_phone = '421949001908', daily_kilometers = 210, start_date = '2025-09-03 11:00:00', end_date = '2025-09-08 11:00:00' WHERE id = 14;
```
**Email info:** OBJ0102500015, Suma: 225.008364€ ✅, Dátum: 2025-09-03 11:00:00

### 31. **Lukáš Slávka (Rental ID: 13)**
```sql
UPDATE rentals SET order_number = 'OBJ00325059', customer_email = 'slavkalukas11@gmail.com', customer_phone = '421907097359', daily_kilometers = 250, start_date = '2025-09-03 14:00:00', end_date = '2025-09-05 14:00:00' WHERE id = 13;
```
**Email info:** OBJ00325059, Suma: 160.008364€ (v DB: 150€), Dátum: 2025-09-03 14:00:00

### 32. **Lukáš Slávka (Rental ID: 13)**
```sql
UPDATE rentals SET order_number = 'OBJ01925246', customer_email = 'slavkalukas11@gmail.com', customer_phone = '421907097359', daily_kilometers = 250, start_date = '2025-09-03 14:00:00', end_date = '2025-09-05 14:00:00' WHERE id = 13;
```
**Email info:** OBJ01925246, Suma: 150.008364€ ✅, Dátum: 2025-09-03 14:00:00

### 33. **Daniel Mutnansky (Rental ID: 10)**
```sql
UPDATE rentals SET order_number = 'OBJ00325060', customer_email = 'dancotnt@gmail.com', customer_phone = '421949122661', daily_kilometers = 300 WHERE id = 10;
```
**Email info:** OBJ00325060, Suma: 100.008364€ ✅, Dátum: 2025-09-04 08:00:00

### 34. **Tromex house s.r.o. (Rental ID: 9)**
```sql
UPDATE rentals SET order_number = 'OBJ2520044', customer_email = 'i-house@email.cz', customer_phone = '421608742735', daily_kilometers = 250, start_date = '2025-09-04 17:00:00', end_date = '2025-09-07 17:00:00' WHERE id = 9;
```
**Email info:** OBJ2520044, Suma: 960.008364€ ✅, Dátum: 2025-09-04 17:00:00

### 35. **Pavol Demjanič (Rental ID: 36)**
```sql
UPDATE rentals SET order_number = 'OBJ02225032', customer_email = 'andaszilard13121994@gmail.com', customer_phone = '421910415416', daily_kilometers = 250, start_date = '2025-09-12 13:00:00', end_date = '2025-09-14 13:00:00' WHERE id = 36;
```
**Email info:** OBJ02225032, Suma: 290.008364€ ✅, Dátum: 2025-09-12 13:00:00

## ❌ NENAPÁROVANÉ PRENÁJMY (52)

- **Karo** (ID: 263) - 16560€, 2025-06-10
- **Luculus** (ID: 12) - 2926.83€, 2025-08-05
- **Danczi** (ID: 123) - 1450€, 2025-08-06
- **Jurista** (ID: 111) - 1375€, 2025-08-10
- **eurocover** (ID: 108) - 1800€, 2025-08-12
- **Rytmus** (ID: 107) - 0€, 2025-08-12
- **Jonas** (ID: 104) - 6341€, 2025-08-14
- **Žubor** (ID: 96) - 1255€, 2025-08-15
- **Demjan** (ID: 101) - 850€, 2025-08-15
- **Dibdiak** (ID: 93) - 620€, 2025-08-16
- **habšuda** (ID: 75) - 500€, 2025-08-17
- **Palo** (ID: 86) - 360€, 2025-08-18
- **pribila** (ID: 76) - 770€, 2025-08-18
- **Juhasova** (ID: 82) - 1000€, 2025-08-18
- **Rakovan** (ID: 78) - 300€, 2025-08-18
- **picino** (ID: 74) - 80€, 2025-08-18
- **Jurista** (ID: 77) - 2400€, 2025-08-18
- **Adamcova** (ID: 80) - 495€, 2025-08-18
- **Fatura** (ID: 85) - 270€, 2025-08-18
- **chandran** (ID: 79) - 865€, 2025-08-18
- **šogi** (ID: 84) - 766€, 2025-08-18
- **Rytmus** (ID: 72) - 240€, 2025-08-20
- **Kaman** (ID: 73) - 1276€, 2025-08-20
- **Szabo** (ID: 69) - 480€, 2025-08-21
- **Fedor ** (ID: 70) - 1120€, 2025-08-21
- **bakala** (ID: 71) - 1120€, 2025-08-21
- **Jurista ** (ID: 67) - 125€, 2025-08-21
- **dincer** (ID: 63) - 220€, 2025-08-22
- **Adamička** (ID: 62) - 2856€, 2025-08-22
- **heglas** (ID: 66) - 260€, 2025-08-22
- **mičuda** (ID: 64) - 1000€, 2025-08-22
- **Javorský** (ID: 65) - 236€, 2025-08-22
- **picino** (ID: 59) - 325€, 2025-08-22
- **rakovan** (ID: 60) - 770€, 2025-08-22
- **Zemanovič** (ID: 58) - 50€, 2025-08-23
- **Švatnerova** (ID: 57) - 220€, 2025-08-25
- **Jurista** (ID: 31) - 125€, 2025-08-26
- **Sedláček** (ID: 54) - 400€, 2025-08-27
- **Jurista** (ID: 30) - 1100€, 2025-08-27
- **Uskovits** (ID: 55) - 800€, 2025-08-27
- **Jurista** (ID: 28) - 875€, 2025-08-28
- **Galko** (ID: 53) - 339.8€, 2025-08-28
- **Mikail Pirgozi** (ID: 23) - 100€, 2025-08-31
- **Vladimir
Brodzianovsky** (ID: 22) - 126€, 2025-09-01
- **Tomáš Horváth** (ID: 16) - 150€, 2025-09-02
- **Vladimir
Brodzianovsky** (ID: 21) - 315€, 2025-09-03
- **Tomáš Horváth** (ID: 15) - 360€, 2025-09-03
- **Baťa** (ID: 51) - 1000€, 2025-09-03
- **Zurbola** (ID: 49) - 900€, 2025-09-05
- **Valko** (ID: 50) - 700€, 2025-09-05
- **Luculus** (ID: 11) - 2926.83€, 2025-09-05
- **Vladimir Geci** (ID: 559) - 800€, 2025-09-05

## ❌ NENAPÁROVANÉ EMAILY (9)

- **čo kukáš** - OBJ02825031 (220.008364€, 2025-08-21 12:00:00)
- **TOMIZ Montage s.r.o.** - OBJ012259565 (660.008364€, 2025-08-22 11:00:00)
- **Eva Obst** - OBJ03125027 (100.008364€, 2025-08-23 11:00:00)
- **Martin Zeman** - OBJ01925230 (150.008364€, 2025-09-21 10:00:00)
- **Vladimir Brodzianovsky** - OBJ0122510132 (220.008364€, 2025-09-01 12:00:00)
- **Vladimir Brodzianovsky** - OBJ01925239 (560.008364€, 2025-09-03 12:00:00)
- **Martin Pavlech** - OBJ01925242 (528.008364€, 2025-09-08 08:00:00)
- **Tomáš Horváth** - OBJ03625009 (220.008364€, 2025-09-02 14:00:00)
- **Jan Mochnac** - OBJ2519948 (360.008364€, 2025-09-05 17:00:00)

---

## 📊 ŠTATISTIKY

- **Úspešnosť napárovania:** 35/79 prenájmov (44%)
- **Nenapárované prenájmy:** 52
- **Nenapárované emaily:** 9
