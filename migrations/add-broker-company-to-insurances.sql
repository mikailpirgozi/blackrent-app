-- =====================================================
-- MIGRATION: Add broker_company to insurances table
-- =====================================================
-- Pridanie maklerská spoločnosť pole do insurances

-- Add broker_company column
ALTER TABLE insurances 
ADD COLUMN IF NOT EXISTS broker_company VARCHAR(255);

COMMENT ON COLUMN insurances.broker_company IS 'Maklerská spoločnosť (voliteľné)';

-- Show final schema
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'insurances' AND column_name = 'broker_company';

-- Summary
SELECT 
  'broker_company column added to insurances table' as status,
  COUNT(*) as total_insurances
FROM insurances;

