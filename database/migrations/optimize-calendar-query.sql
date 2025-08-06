-- 🚀 FÁZA 2.1: Optimalized Calendar Query  
-- Optimizovaná verzia CTE query s lepším indexom využitím

-- 1. FORCE INDEX USAGE pre rentals date range
-- Pridaj špecifický partial index pre aktuálny mesiac
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rentals_current_month_fast
ON rentals (vehicle_id, start_date, end_date) 
WHERE start_date <= CURRENT_DATE + INTERVAL '60 days' 
AND end_date >= CURRENT_DATE - INTERVAL '30 days';

-- 2. OPTIMALIZOVANÝ CTE QUERY
-- Redukovanie CROSS JOIN pomocou WHERE klauzúl
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH date_range AS (
  -- Definuj presný rozsah namiesto generate_series v CROSS JOIN
  SELECT CURRENT_DATE as start_date, CURRENT_DATE + INTERVAL '30 days' as end_date
),
active_rentals AS (
  -- Pre-filter rentals PRED CROSS JOIN
  SELECT r.*, dr.start_date as query_start, dr.end_date as query_end
  FROM rentals r, date_range dr
  WHERE r.start_date <= dr.end_date 
  AND r.end_date >= dr.start_date
),
active_unavailabilities AS (
  -- Pre-filter unavailabilities PRED CROSS JOIN
  SELECT u.*, dr.start_date as query_start, dr.end_date as query_end  
  FROM vehicle_unavailability u, date_range dr
  WHERE u.start_date <= dr.end_date
  AND u.end_date >= dr.start_date
),
calendar_dates AS (
  SELECT generate_series(dr.start_date, dr.end_date, '1 day'::interval)::date as date
  FROM date_range dr
),
optimized_calendar AS (
  SELECT
    cd.date,
    v.id as vehicle_id,
    v.brand || ' ' || v.model as vehicle_name,
    v.license_plate,
    -- RENTALS JOIN (už pre-filtrované)
    ar.id as rental_id,
    ar.customer_name,
    ar.is_flexible,
    ar.rental_type,
    CASE
      WHEN ar.id IS NOT NULL THEN
        CASE WHEN ar.is_flexible = true THEN 'flexible' ELSE 'rented' END
      ELSE NULL
    END as rental_status,
    -- UNAVAILABILITIES JOIN (už pre-filtrované)  
    au.id as unavailability_id,
    au.reason as unavailability_reason,
    au.type as unavailability_type,
    au.priority as unavailability_priority,
    -- FINAL STATUS
    CASE
      WHEN ar.id IS NOT NULL THEN
        CASE WHEN ar.is_flexible = true THEN 'flexible' ELSE 'rented' END
      WHEN au.type IS NOT NULL THEN au.type
      ELSE 'available'
    END as final_status
  FROM calendar_dates cd
  CROSS JOIN vehicles v
  LEFT JOIN active_rentals ar ON (
    ar.vehicle_id = v.id 
    AND cd.date BETWEEN ar.start_date AND ar.end_date
  )
  LEFT JOIN active_unavailabilities au ON (
    au.vehicle_id = v.id
    AND cd.date BETWEEN au.start_date AND au.end_date
  )
)
SELECT
  date,
  vehicle_id,
  vehicle_name,
  license_plate,
  final_status as status,
  rental_id,
  customer_name,
  is_flexible,
  rental_type,
  unavailability_id,
  unavailability_reason,
  unavailability_type,
  unavailability_priority
FROM optimized_calendar
ORDER BY date, vehicle_id;