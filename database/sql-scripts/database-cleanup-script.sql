-- 🚗 BLACKRENT DATABASE CLEANUP & OPTIMIZATION SCRIPT
-- Spustenie: psql -f database-cleanup-script.sql

BEGIN;

-- ===== 1. OPRAVA NEKONZISTENTNÝCH FIRIEM =====
UPDATE vehicles v 
SET company = c.name 
FROM companies c 
WHERE v.owner_company_id = c.id 
AND v.company != c.name;

-- ===== 2. OPRAVA CHÝBAJÚCICH OWNER_COMPANY_ID =====
UPDATE vehicles v 
SET owner_company_id = c.id 
FROM companies c 
WHERE v.company = c.name 
AND v.owner_company_id IS NULL;

-- ===== 3. PRIDANIE CHÝBAJÚCICH KATEGÓRIÍ =====
-- Aktualizácia SUV vozidiel na správne kategórie
UPDATE vehicles 
SET category = 'suv'
WHERE (brand = 'BMW' AND model LIKE '%X%') 
   OR (brand = 'Audi' AND model LIKE '%Q%')
   OR (brand = 'Mercedes' AND model LIKE '%GL%')
   OR model ILIKE '%suv%';

-- Aktualizácia dodávok
UPDATE vehicles 
SET category = 'dodavky'
WHERE model ILIKE '%sprinter%' 
   OR model ILIKE '%transit%' 
   OR model ILIKE '%crafter%'
   OR model ILIKE '%ducato%';

-- Pridanie viacmiestnych vozidiel
UPDATE vehicles 
SET category = 'viacmiestne'
WHERE model ILIKE '%sharan%' 
   OR model ILIKE '%galaxy%'
   OR model ILIKE '%alhambra%'
   OR model ILIKE '%touran%'
   OR model ILIKE '%7 seat%';

-- ===== 4. OPRAVA PRENÁJMOV STATUSOV =====
-- Aktuálne aktívne prenájmy (v priebehu dnes)
UPDATE rentals 
SET status = 'active' 
WHERE start_date <= CURRENT_DATE 
AND end_date >= CURRENT_DATE 
AND status = 'pending';

-- Budúce prenájmy
UPDATE rentals 
SET status = 'confirmed' 
WHERE start_date > CURRENT_DATE 
AND status = 'pending' 
AND confirmed = true;

-- Ukončené prenájmy
UPDATE rentals 
SET status = 'finished' 
WHERE end_date < CURRENT_DATE 
AND status = 'pending';

-- ===== 5. SYNCHRONIZÁCIA FLEXIBILNÝCH PRENÁJMOV =====
UPDATE rentals 
SET is_flexible = true 
WHERE rental_type = 'flexible' 
AND is_flexible = false;

UPDATE rentals 
SET rental_type = 'flexible' 
WHERE is_flexible = true 
AND rental_type = 'standard';

-- ===== 6. ÚDRŽBA A OPTIMALIZÁCIA =====
-- Reindexovanie pre lepší výkon
REINDEX TABLE vehicles;
REINDEX TABLE rentals;
REINDEX TABLE companies;
REINDEX TABLE vehicle_unavailability;

-- Aktualizácia štatistík
ANALYZE vehicles;
ANALYZE rentals;
ANALYZE companies;
ANALYZE vehicle_unavailability;

-- ===== 7. VALIDAČNÉ CONSTRAINTS =====
-- Zabránenie budúcich nekonzistencií
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_company_sync 
CHECK (
  owner_company_id IS NULL OR 
  company = (SELECT name FROM companies WHERE id = owner_company_id)
);

COMMIT;

-- ===== VÝSLEDNÝ REPORT =====
SELECT 
  'VEHICLES' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT company) as unique_companies,
  COUNT(DISTINCT category) as unique_categories
FROM vehicles
UNION ALL
SELECT 
  'RENTALS' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT status) as unique_statuses,
  COUNT(*) FILTER (WHERE is_flexible = true) as flexible_rentals  
FROM rentals
UNION ALL
SELECT 
  'COMPANIES' as table_name,
  COUNT(*) as total_records,
  0 as unused1,
  0 as unused2
FROM companies; 