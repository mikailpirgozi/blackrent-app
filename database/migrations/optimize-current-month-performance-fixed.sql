-- 🚀 FÁZA 1.1: KRITICKÉ INDEXY PRE KALENDÁR DOSTUPNOSTI (OPRAVENÉ)
-- Optimalizácia pre aktuálny mesiac - očakávané zrýchlenie z 10s na 3-4s

-- =============================================================================
-- RENTALS TABLE OPTIMALIZATION  
-- =============================================================================

-- 🔥 Index pre aktívne prenájmy (bez CURRENT_DATE funkcie)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_active_recent
ON rentals (vehicle_id, start_date, end_date) 
WHERE status IN ('active', 'confirmed');

-- 🔥 Index pre flexibilné prenájmy (bez date limitation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_flexible_optimized
ON rentals (vehicle_id, is_flexible, start_date, end_date)
WHERE is_flexible = true;

-- =============================================================================
-- VEHICLE_UNAVAILABILITY TABLE OPTIMALIZATION
-- =============================================================================

-- 🔥 Index pre aktívne unavailability (bez CURRENT_DATE)  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unavailability_active_recent
ON vehicle_unavailability (vehicle_id, type, start_date, end_date);

-- =============================================================================
-- VEHICLES TABLE OPTIMALIZATION  
-- =============================================================================

-- 🔥 Optimalizovaný index pre vehicles lookup (bez owner_company_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_calendar_lookup_fixed
ON vehicles (id, status, brand, model)  
INCLUDE (license_plate, company);

-- =============================================================================
-- QUERY PERFORMANCE TEST
-- =============================================================================

-- Test query performance pre rentals
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, vehicle_id, start_date, end_date, customer_name, is_flexible
FROM rentals 
WHERE (start_date <= CURRENT_DATE + INTERVAL '1 month' AND end_date >= CURRENT_DATE)
LIMIT 10;

-- Test query performance pre unavailabilities  
EXPLAIN (ANALYZE, BUFFERS)
SELECT vehicle_id, type, start_date, end_date, reason
FROM vehicle_unavailability  
WHERE start_date <= CURRENT_DATE + INTERVAL '1 month' AND end_date >= CURRENT_DATE
LIMIT 10;

-- Štatistiky tabuliek pre query planner
ANALYZE rentals;
ANALYZE vehicle_unavailability;  
ANALYZE vehicles;