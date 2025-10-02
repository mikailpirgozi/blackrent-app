-- 🚀 FÁZA 1.1: KRITICKÉ INDEXY PRE KALENDÁR DOSTUPNOSTI 
-- Optimalizácia pre aktuálny mesiac - očakávané zrýchlenie z 10s na 3-4s

-- =============================================================================
-- RENTALS TABLE OPTIMALIZATION  
-- =============================================================================

-- 🔥 NAJDÔLEŽITEJŠÍ: Composite index pre date range queries na rentals
-- Tento index dramaticky zrýchli WHERE (start_date <= $2 AND end_date >= $1)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_current_month_optimized
ON rentals (start_date, end_date, vehicle_id, is_flexible)
INCLUDE (customer_name, rental_type, status);

-- 🔥 Partial index pre aktívne prenájmy v aktuálnom období  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_active_current_period
ON rentals (vehicle_id, start_date, end_date) 
WHERE status IN ('active', 'confirmed') 
AND start_date >= CURRENT_DATE - INTERVAL '1 month'
AND end_date <= CURRENT_DATE + INTERVAL '1 month';

-- 🔥 Index pre flexibilné prenájmy (často sa dopytujeme)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_flexible_current
ON rentals (vehicle_id, is_flexible, start_date, end_date)
WHERE is_flexible = true
AND start_date >= CURRENT_DATE - INTERVAL '1 month';

-- =============================================================================
-- VEHICLE_UNAVAILABILITY TABLE OPTIMALIZATION
-- =============================================================================

-- 🔥 Composite index pre unavailability date ranges
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unavailability_current_month_optimized  
ON vehicle_unavailability (start_date, end_date, vehicle_id, type)
INCLUDE (reason, priority);

-- 🔥 Partial index pre aktívne unavailability v aktuálnom období
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unavailability_active_current
ON vehicle_unavailability (vehicle_id, type, start_date, end_date)
WHERE start_date >= CURRENT_DATE - INTERVAL '1 month'
AND end_date <= CURRENT_DATE + INTERVAL '1 month';

-- =============================================================================
-- VEHICLES TABLE OPTIMALIZATION  
-- =============================================================================

-- 🔥 Optimalizovaný index pre vehicles lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_calendar_lookup
ON vehicles (id, status, brand, model)  
INCLUDE (license_plate, company, owner_company_id);

-- 🔥 Index pre dostupné vozidlá (najčastejšie dopytované)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_available_status
ON vehicles (id, brand, model, license_plate)
WHERE status = 'available';

-- =============================================================================
-- STATISTICS & MONITORING
-- =============================================================================

-- Štatistiky tabuliek pre query planner
ANALYZE rentals;
ANALYZE vehicle_unavailability;  
ANALYZE vehicles;

-- Výpis informácií o nových indexoch
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE indexname LIKE '%current_month%' OR indexname LIKE '%calendar%'
ORDER BY tablename, indexname;

-- Veľkosť indexov
SELECT 
  schemaname,
  tablename, 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE indexname LIKE '%current_month%' OR indexname LIKE '%calendar%'
ORDER BY pg_relation_size(indexname::regclass) DESC;