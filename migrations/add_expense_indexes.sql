-- ===============================================
-- EXPENSES INDEXES - PERFORMANCE OPTIMIZATION
-- ===============================================
-- Vytvorené: 2025-01-04
-- Účel: Optimalizovať queries v expenses sekcii
-- Odhadované zlepšenie: 5-10x rýchlejšie queries
-- ===============================================

-- Základné indexy pre filter/search
CREATE INDEX IF NOT EXISTS idx_expenses_company 
  ON expenses(company);

CREATE INDEX IF NOT EXISTS idx_expenses_category 
  ON expenses(category);

CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_id 
  ON expenses("vehicleId");

CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON expenses(date DESC);

-- Composite index pre najčastejšie query pattern
-- (filter by company + category + sort by date)
CREATE INDEX IF NOT EXISTS idx_expenses_company_category_date 
  ON expenses(company, category, date DESC);

-- Partial index pre recurring expenses
-- (len aktívne a splatné náklady)
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_active_due
  ON recurring_expenses("isActive", "nextGenerationDate")
  WHERE "isActive" = true;

-- Update database statistics
ANALYZE expenses;
ANALYZE recurring_expenses;

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Po vytvorení indexov spusti na kontrolu:
--
-- SELECT indexname, tablename 
-- FROM pg_indexes 
-- WHERE tablename IN ('expenses', 'recurring_expenses')
-- ORDER BY tablename, indexname;
--
-- Expected output:
-- - idx_expenses_company
-- - idx_expenses_category
-- - idx_expenses_vehicle_id
-- - idx_expenses_date
-- - idx_expenses_company_category_date
-- - idx_recurring_expenses_active_due
--
-- Test query performance:
-- EXPLAIN ANALYZE 
-- SELECT * FROM expenses 
-- WHERE company = 'Black Holding' 
-- AND category = 'fuel'
-- ORDER BY date DESC;
--
-- Mali by byť "Index Scan" namiesto "Seq Scan"
-- ===============================================
