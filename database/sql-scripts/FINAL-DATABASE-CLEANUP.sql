-- 🚀 FINÁLNE ČISTENIE BLACKRENT DATABÁZY
-- Optimalizácia na základe používateľských požiadaviek

BEGIN;

-- ========================================
-- 1️⃣ OPRAVA STATUSOV PRENÁJMOV
-- ========================================

SELECT 'KROK 1: Oprava statusov prenájmov...' as info;

-- Zobrazenie PRED opravou
SELECT 
  'PRED OPRAVOU' as faza,
  status,
  COUNT(*) as pocet
FROM rentals 
GROUP BY status
ORDER BY pocet DESC;

-- ČAKÁ NA PRENÁJOM (start_date > dnes)
UPDATE rentals 
SET status = 'pending', confirmed = false
WHERE start_date > CURRENT_DATE 
  AND return_protocol_id IS NULL;

-- V PRENÁJME (dnes medzi start_date a end_date)
UPDATE rentals 
SET status = 'active', confirmed = true
WHERE start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE
  AND return_protocol_id IS NULL;

-- PRENÁJOM UKONČENÝ (end_date < dnes ale bez protokolu)
UPDATE rentals 
SET status = 'finished', confirmed = false
WHERE end_date < CURRENT_DATE 
  AND return_protocol_id IS NULL;

-- PRENÁJOM UKONČENÝ A POTVRDENÝ (má return protokol)
UPDATE rentals 
SET status = 'completed', confirmed = true
WHERE return_protocol_id IS NOT NULL;

-- Zobrazenie PO oprave
SELECT 
  'PO OPRAVE' as faza,
  status,
  COUNT(*) as pocet
FROM rentals 
GROUP BY status
ORDER BY pocet DESC;

-- ========================================
-- 2️⃣ SYNCHRONIZÁCIA FLEXIBILNÝCH PRENÁJMOV  
-- ========================================

SELECT 'KROK 2: Synchronizácia flexibilných prenájmov...' as info;

-- Zobrazenie nekonzistencií PRED opravou
SELECT 
  'PRED SYNC' as faza,
  rental_type,
  is_flexible,
  COUNT(*) as pocet
FROM rentals 
GROUP BY rental_type, is_flexible;

-- Synchronizácia: rental_type -> is_flexible
UPDATE rentals 
SET is_flexible = true
WHERE rental_type = 'flexible' AND is_flexible = false;

UPDATE rentals 
SET is_flexible = false  
WHERE rental_type = 'standard' AND is_flexible = true;

-- Zobrazenie PO synchronizácii
SELECT 
  'PO SYNC' as faza,
  rental_type,
  is_flexible,
  COUNT(*) as pocet
FROM rentals 
GROUP BY rental_type, is_flexible;

-- ========================================
-- 3️⃣ ZMAZANIE DUPLICITNÝCH STĹPCOV
-- ========================================

SELECT 'KROK 3: Zmazanie duplicitných stĺpcov...' as info;

-- Zobrazenie čo ideme zmazať
SELECT 
  COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as customer_id_filled,
  COUNT(CASE WHEN company IS NOT NULL THEN 1 END) as company_filled,
  COUNT(CASE WHEN rental_type IS NOT NULL THEN 1 END) as rental_type_filled,
  COUNT(*) as total_rentals
FROM rentals;

-- ZMAZANIE DUPLICITNÝCH STĹPCOV
ALTER TABLE rentals DROP COLUMN IF EXISTS customer_id;     -- duplikát customer_name
ALTER TABLE rentals DROP COLUMN IF EXISTS company;         -- duplikát vehicles.company  
ALTER TABLE rentals DROP COLUMN IF EXISTS rental_type;     -- duplikát is_flexible

-- ========================================
-- 4️⃣ VYTVORENIE AUTOMATICKÉHO TRIGGERA
-- ========================================

SELECT 'KROK 4: Vytvorenie triggera pre statusy...' as info;

-- Trigger funkcia pre automatické nastavovanie statusov
CREATE OR REPLACE FUNCTION update_rental_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automaticky nastav status na základe dátumov
  IF NEW.return_protocol_id IS NOT NULL THEN
    NEW.status := 'completed';
    NEW.confirmed := true;
  ELSIF NEW.end_date < CURRENT_DATE THEN
    NEW.status := 'finished'; 
    NEW.confirmed := false;
  ELSIF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    NEW.status := 'active';
    NEW.confirmed := true;
  ELSIF NEW.start_date > CURRENT_DATE THEN
    NEW.status := 'pending';
    NEW.confirmed := false;  
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Vytvorenie triggera
DROP TRIGGER IF EXISTS rental_status_trigger ON rentals;
CREATE TRIGGER rental_status_trigger
  BEFORE INSERT OR UPDATE ON rentals
  FOR EACH ROW EXECUTE FUNCTION update_rental_status();

-- ========================================
-- 5️⃣ FINÁLNE ŠTATISTIKY
-- ========================================

SELECT 'KROK 5: Finálne štatistiky...' as info;

-- Počet stĺpcov PO čistení
SELECT 
  'RENTALS TABUĽKA PO ČISTENÍ' as info,
  COUNT(*) as pocet_stlpcov
FROM information_schema.columns 
WHERE table_name = 'rentals' AND table_schema = 'public';

-- Rozdelenie statusov
SELECT 
  'STATUS ROZDELENIE' as kategoria,
  status,
  COUNT(*) as pocet,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rentals), 1) as percento
FROM rentals 
GROUP BY status 
ORDER BY pocet DESC;

-- Flexibilné vs štandardné prenájmy
SELECT 
  'FLEXIBILNÉ PRENÁJMY' as kategoria,
  CASE WHEN is_flexible THEN 'Flexibilné' ELSE 'Štandardné' END as typ,
  COUNT(*) as pocet,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM rentals), 1) as percento
FROM rentals 
GROUP BY is_flexible;

-- Reindex pre výkon
REINDEX TABLE rentals;
ANALYZE rentals;

SELECT '🎉 DATABÁZA ÚSPEŠNE VYČISTENÁ!' as vysledok;

COMMIT; 