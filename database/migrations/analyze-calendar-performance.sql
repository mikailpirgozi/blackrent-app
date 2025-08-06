-- 🚀 FÁZA 2.1: Query Performance Analysis
-- Analyzuje výkonnosť unified calendar query z FÁZY 1.2

-- Test query pre aktuálny mesiac (najčastejší use case)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
WITH calendar_dates AS (
  SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::interval)::date as date
),
vehicle_calendar AS (
  SELECT
    cd.date,
    v.id as vehicle_id,
    v.brand || ' ' || v.model as vehicle_name,
    v.license_plate,
    v.status as vehicle_status,
    v.company_id as vehicle_company_id
  FROM calendar_dates cd
  CROSS JOIN vehicles v
),
calendar_with_rentals AS (
  SELECT
    vc.*,
    r.id as rental_id,
    r.customer_name,
    r.is_flexible,
    r.rental_type,
    CASE
      WHEN r.id IS NOT NULL THEN
        CASE WHEN r.is_flexible = true THEN 'flexible' ELSE 'rented' END
      ELSE NULL
    END as rental_status
  FROM vehicle_calendar vc
  LEFT JOIN rentals r ON (
    r.vehicle_id = vc.vehicle_id
    AND vc.date BETWEEN r.start_date AND r.end_date
  )
),
calendar_final AS (
  SELECT
    cwr.*,
    u.id as unavailability_id,
    u.reason as unavailability_reason,
    u.type as unavailability_type,
    u.priority as unavailability_priority,
    CASE
      WHEN cwr.rental_status IS NOT NULL THEN cwr.rental_status
      WHEN u.type IS NOT NULL THEN u.type
      ELSE 'available'
    END as final_status
  FROM calendar_with_rentals cwr
  LEFT JOIN vehicle_unavailability u ON (
    u.vehicle_id = cwr.vehicle_id
    AND cwr.date BETWEEN u.start_date AND u.end_date
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
FROM calendar_final
ORDER BY date, vehicle_id;

-- Dodatočná analýza jednotlivých častí
\echo '--- CROSS JOIN Performance ---'
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM calendar_dates cd CROSS JOIN vehicles v 
WHERE cd.date = generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '1 day'::interval)::date;

\echo '--- Rentals JOIN Performance ---'  
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM rentals r 
WHERE r.start_date <= CURRENT_DATE + INTERVAL '30 days' 
AND r.end_date >= CURRENT_DATE;

\echo '--- Vehicle Unavailability JOIN Performance ---'
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) FROM vehicle_unavailability u
WHERE u.start_date <= CURRENT_DATE + INTERVAL '30 days'
AND u.end_date >= CURRENT_DATE;

\echo '--- Index Usage Analysis ---'
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename IN ('rentals', 'vehicle_unavailability', 'vehicles')
ORDER BY idx_scan DESC;