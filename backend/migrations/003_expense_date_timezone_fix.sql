-- ✅ FÁZA 1.1: Timezone Fix - Zmena expense.date z TIMESTAMP na DATE
-- Táto migrácia odstráni timezone konverzie z expense dátumov
-- Dátum 15.01.2025 zostane 15.01.2025 bez ohľadu na timezone

BEGIN;

-- 1. Backup aktuálnych dát (pre istotu)
CREATE TEMP TABLE expenses_backup_timezone_fix AS 
SELECT * FROM expenses;

-- 2. Zmena typu stĺpca z TIMESTAMP na DATE
-- Toto odstráni čas a timezone, ponechá len dátum
ALTER TABLE expenses 
  ALTER COLUMN date TYPE DATE 
  USING date::DATE;

-- 3. Verify že migrácia prebehla správne
DO $$
DECLARE
  date_type text;
BEGIN
  SELECT data_type INTO date_type
  FROM information_schema.columns
  WHERE table_name = 'expenses' AND column_name = 'date';
  
  IF date_type != 'date' THEN
    RAISE EXCEPTION 'Migration failed - date column is still type %, expected date', date_type;
  END IF;
  
  RAISE NOTICE '✅ Migration successful - expenses.date is now DATE type (no timezone)';
END $$;

-- 4. Rovnaká zmena pre recurring_expenses (snake_case stĺpce!)
ALTER TABLE recurring_expenses
  ALTER COLUMN start_date TYPE DATE 
  USING start_date::DATE;

ALTER TABLE recurring_expenses
  ALTER COLUMN end_date TYPE DATE 
  USING end_date::DATE;

ALTER TABLE recurring_expenses
  ALTER COLUMN last_generated_date TYPE DATE 
  USING last_generated_date::DATE;

ALTER TABLE recurring_expenses
  ALTER COLUMN next_generation_date TYPE DATE 
  USING next_generation_date::DATE;

-- 5. Verify recurring_expenses
DO $$
DECLARE
  start_date_type text;
  end_date_type text;
BEGIN
  SELECT data_type INTO start_date_type
  FROM information_schema.columns
  WHERE table_name = 'recurring_expenses' AND column_name = 'start_date';
  
  SELECT data_type INTO end_date_type
  FROM information_schema.columns
  WHERE table_name = 'recurring_expenses' AND column_name = 'end_date';
  
  IF start_date_type != 'date' OR end_date_type != 'date' THEN
    RAISE EXCEPTION 'Migration failed for recurring_expenses';
  END IF;
  
  RAISE NOTICE '✅ Recurring expenses dates migrated successfully';
END $$;

-- 6. Analýza tabuliek pre lepší performance
ANALYZE expenses;
ANALYZE recurring_expenses;

COMMIT;

-- 📊 Výsledok:
-- expenses.date: TIMESTAMP WITH TIME ZONE → DATE
-- recurring_expenses dátumy: TIMESTAMP WITH TIME ZONE → DATE
-- 
-- Príklad:
-- PRED: "2025-01-15T00:00:00.000Z" (UTC timezone)
-- PO:   "2025-01-15" (len dátum, bez času a timezone)
--
-- ✅ Dátumy sa už nebudú meniť pri editácii!

