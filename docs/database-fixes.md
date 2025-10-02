# Database Time Fixes

## 2025-08-25: Oprava časov v prenájmoch

### Vykonané zmeny:
- CSV import prenájmy (bez order_number): nastavené na 9:00-9:00
- Email objednávky (s order_number): zachované originálne časy z parsingu
- Opravených 512 CSV prenájmov z 00:00:00 na 9:00:00
- Zachovaných 8 email objednávok s originálnymi časmi
- Celkovo upravených 520 prenájmov v databáze

### SQL príkazy:
```sql
-- Nastavenie CSV prenájmov na 9:00-9:00
UPDATE rentals SET start_date = DATE_TRUNC('day', start_date) + INTERVAL '9 hours' WHERE order_number IS NULL OR order_number = '';
UPDATE rentals SET end_date = DATE_TRUNC('day', end_date) + INTERVAL '9 hours' WHERE order_number IS NULL OR order_number = '';
```

