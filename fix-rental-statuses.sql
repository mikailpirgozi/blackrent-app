-- 🚗 OPRAVA STATUSOV PRENÁJMOV - BLACKRENT
-- Logika podľa požiadaviek užívateľa

BEGIN;

-- Zobrazenie súčasného stavu PRED opravou
SELECT 
  'PRED OPRAVOU' as faza,
  status,
  COUNT(*) as pocet,
  MIN(start_date) as najskorsi_zaciatok,
  MAX(end_date) as najneskorsi_koniec
FROM rentals 
GROUP BY status;

-- ===== 1. ČAKÁ NA PRENÁJOM =====
-- Prenájom ktorý ešte nezačal (start_date > dnes)
UPDATE rentals 
SET status = 'pending', confirmed = false
WHERE start_date > CURRENT_DATE 
  AND return_protocol_id IS NULL;  -- nemá return protokol

-- ===== 2. V PRENÁJME =====  
-- Prenájom ktorý práve prebieha (dnes je medzi start_date a end_date)
UPDATE rentals 
SET status = 'active', confirmed = true
WHERE start_date <= CURRENT_DATE 
  AND end_date >= CURRENT_DATE
  AND return_protocol_id IS NULL;  -- nemá return protokol

-- ===== 3. PRENÁJOM UKONČENÝ =====
-- Prenájom ktorý sa už skončil (end_date < dnes) ale nie je potvrdený
UPDATE rentals 
SET status = 'finished', confirmed = false
WHERE end_date < CURRENT_DATE 
  AND return_protocol_id IS NULL;  -- nemá return protokol

-- ===== 4. PRENÁJOM UKONČENÝ A POTVRDENÝ =====
-- Prenájom s return protokolom ALEBO manuálne potvrdený
UPDATE rentals 
SET status = 'completed', confirmed = true
WHERE (return_protocol_id IS NOT NULL OR confirmed = true)
  AND end_date < CURRENT_DATE;

-- Zobrazenie stavu PO oprave
SELECT 
  'PO OPRAVE' as faza,
  status,
  COUNT(*) as pocet,
  MIN(start_date) as najskorsi_zaciatok,
  MAX(end_date) as najneskorsi_koniec
FROM rentals 
GROUP BY status;

-- Detailný výpis všetkých prenájmov s novými statusmi
SELECT 
  customer_name,
  start_date::date,
  end_date::date,
  status,
  confirmed,
  CASE 
    WHEN return_protocol_id IS NOT NULL THEN 'Má return protokol'
    WHEN start_date > CURRENT_DATE THEN 'Čaká na prenájom'
    WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 'Prebieha'
    WHEN end_date < CURRENT_DATE THEN 'Ukončený'
    ELSE 'Neznámy stav'
  END as logika_vysvetlenie
FROM rentals 
ORDER BY start_date;

COMMIT;

-- Vytvorenie triggera pre automatické nastavovanie statusov v budúcnosti
CREATE OR REPLACE FUNCTION update_rental_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Automaticky nastav status na základe dátumov pri INSERT/UPDATE
  IF NEW.return_protocol_id IS NOT NULL THEN
    -- Má return protokol = ukončený a potvrdený
    NEW.status := 'completed';
    NEW.confirmed := true;
  ELSIF NEW.end_date < CURRENT_DATE THEN
    -- Prenájom sa skončil = ukončený
    NEW.status := 'finished';
    NEW.confirmed := false;
  ELSIF NEW.start_date <= CURRENT_DATE AND NEW.end_date >= CURRENT_DATE THEN
    -- Prenájom prebieha = aktívny
    NEW.status := 'active';
    NEW.confirmed := true;
  ELSIF NEW.start_date > CURRENT_DATE THEN
    -- Prenájom ešte nezačal = čaká
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