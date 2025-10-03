-- ===================================================================
-- HOTFIX: Pridať processing_fee a last_payment_date do leasings
-- ===================================================================
-- Spustiť tento script ak tabuľka leasings už existuje bez týchto stĺpcov

-- Pridaj processing_fee stĺpec
ALTER TABLE leasings 
ADD COLUMN IF NOT EXISTS processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Pridaj last_payment_date stĺpec  
ALTER TABLE leasings
ADD COLUMN IF NOT EXISTS last_payment_date DATE;

-- Komentáre
COMMENT ON COLUMN leasings.processing_fee IS 
  'Jednorazový poplatok za spracovanie úveru - pripočíta sa k efektívnej výške úveru pre RPMN výpočet';
  
COMMENT ON COLUMN leasings.last_payment_date IS 
  'Dátum poslednej splátky (vypočítané z first_payment_date + total_installments alebo manuálne zadané)';

-- Koniec scriptu

