-- 🔄 ROLLBACK SCRIPT PRE FLEXIBILNÉ PRENÁJMY
-- Tento súbor použite ak sa chcete vrátiť na pôvodný stav

-- KROK 1: Odstránenie nových stĺpcov z rentals tabuľky
ALTER TABLE rentals 
DROP COLUMN IF EXISTS rental_type,
DROP COLUMN IF EXISTS is_flexible,
DROP COLUMN IF EXISTS flexible_end_date,
DROP COLUMN IF EXISTS can_be_overridden,
DROP COLUMN IF EXISTS override_priority,
DROP COLUMN IF EXISTS notification_threshold,
DROP COLUMN IF EXISTS auto_extend,
DROP COLUMN IF EXISTS override_history;

-- KROK 2: Obnovenie pôvodnej validácie (ak bolo zmenené)
-- Tento krok sa vykoná manuálne v kóde

-- KROK 3: Kontrola či sú všetky zmeny vrátené
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rentals' 
  AND column_name IN ('rental_type', 'is_flexible', 'flexible_end_date', 'can_be_overridden', 'override_priority', 'notification_threshold', 'auto_extend', 'override_history');

-- Ak je výsledok prázdny, rollback bol úspešný

-- POZNÁMKA: Existujúce dáta zostanú nezmenené
-- Len sa odstránia nové stĺpce a funkcionalita