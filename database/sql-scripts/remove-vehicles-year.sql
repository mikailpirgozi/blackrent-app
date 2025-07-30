-- 🗑️ ODSTRÁNENIE ZBYTOČNÉHO YEAR POĽA Z VEHICLES TABUĽKY
-- BlackRent optimalizácia

BEGIN;

-- Zobrazenie súčasného stavu
SELECT 
  'PRED ODSTRÁNENÍM' as stav,
  COUNT(*) as celkom_vozidiel,
  COUNT(year) as vozidla_s_rokom,
  MIN(year) as najstarsi_rok,
  MAX(year) as najnovsi_rok,
  COUNT(DISTINCT year) as pocet_roznych_rokov
FROM vehicles;

-- Analýza používania year poľa
SELECT 
  year,
  COUNT(*) as pocet_vozidiel,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vehicles), 1) as percento
FROM vehicles 
WHERE year IS NOT NULL
GROUP BY year 
ORDER BY year DESC;

-- POZNÁMKA: Ak sa year pole používa niekde v aplikácii, 
-- najskôr je potrebné aktualizovať kód!

-- ODSTRÁNENIE year stĺpca (spustiť LEN po update kódu)
-- ALTER TABLE vehicles DROP COLUMN year;

-- Zobrazenie výsledku po odstránení (zakomentované)
-- SELECT 
--   'PO ODSTRÁNENÍ' as stav,
--   COUNT(*) as celkom_vozidiel
-- FROM vehicles;

COMMIT;

-- POZNÁMKY PRE MIGRÁCIU:
-- 1. Najskôr grep-search v kóde na 'year' a 'rok'
-- 2. Odstrániť všetky referencie na vehicle.year
-- 3. Update API endpointov
-- 4. Update frontend komponentov
-- 5. Až potom spustiť ALTER TABLE DROP COLUMN 